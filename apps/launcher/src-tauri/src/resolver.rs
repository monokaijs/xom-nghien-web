use crate::{
    models::{LockedPackage, RequestedPackage},
    thunderstore::{split_coordinate, ThunderstorePackage, ThunderstoreVersion},
};
use anyhow::{Context, Result};
use std::collections::{BTreeMap, HashMap, HashSet};

const LOADER_IDENTITY: &str = "denikson-bepinexpack_valheim";

pub fn resolve(
    catalog: &[ThunderstorePackage],
    requested: &[RequestedPackage],
) -> Result<BTreeMap<String, LockedPackage>> {
    let by_identity: HashMap<_, _> = catalog
        .iter()
        .map(|package| {
            (
                (
                    package.owner.to_ascii_lowercase(),
                    package.name.to_ascii_lowercase(),
                ),
                package,
            )
        })
        .collect();
    let preferred_loader_version = direct_loader_version(requested)?;
    let mut locked = BTreeMap::new();
    let mut visiting = HashSet::new();
    for request in requested.iter().filter(|request| request.enabled) {
        visit(
            &request.coordinate,
            &request.origin,
            &by_identity,
            preferred_loader_version.as_deref(),
            &mut visiting,
            &mut locked,
        )?;
    }
    Ok(locked)
}

fn direct_loader_version(requested: &[RequestedPackage]) -> Result<Option<String>> {
    let mut preferred: Option<String> = None;
    for request in requested.iter().filter(|request| request.enabled) {
        let (namespace, name, version) = split_coordinate(&request.coordinate)?;
        let identity = format!(
            "{}-{}",
            namespace.to_ascii_lowercase(),
            name.to_ascii_lowercase()
        );
        if identity != LOADER_IDENTITY {
            continue;
        }
        if preferred
            .as_deref()
            .is_some_and(|existing| existing != version)
        {
            anyhow::bail!(
                "Conflicting directly requested versions for {namespace}-{name}: {} and {version}",
                preferred.as_deref().unwrap_or_default()
            );
        }
        preferred = Some(version.to_owned());
    }
    Ok(preferred)
}

fn visit(
    coordinate: &str,
    origin: &str,
    catalog: &HashMap<(String, String), &ThunderstorePackage>,
    preferred_loader_version: Option<&str>,
    visiting: &mut HashSet<String>,
    locked: &mut BTreeMap<String, LockedPackage>,
) -> Result<()> {
    let (namespace, name, requested_version) = split_coordinate(coordinate)?;
    let identity = format!(
        "{}-{}",
        namespace.to_ascii_lowercase(),
        name.to_ascii_lowercase()
    );
    // A server's direct BepInEx pin is authoritative. Thunderstore mods often
    // carry an older exact BepInEx dependency even though they are compatible
    // with the newer shared runtime selected by the server.
    let version = if identity == LOADER_IDENTITY {
        preferred_loader_version.unwrap_or(requested_version)
    } else {
        requested_version
    };
    if visiting.contains(&identity) {
        anyhow::bail!("Dependency cycle detected at {namespace}-{name}");
    }
    if let Some(existing) = locked.get_mut(&identity) {
        if existing.version != version {
            anyhow::bail!(
                "Conflicting versions requested for {namespace}-{name}: {} and {version}",
                existing.version
            );
        }
        if !existing.origins.iter().any(|item| item == origin) {
            existing.origins.push(origin.to_owned());
        }
        return Ok(());
    }
    if !visiting.insert(identity.clone()) {
        anyhow::bail!("Dependency cycle detected at {namespace}-{name}");
    }

    let package = catalog
        .get(&(namespace.to_ascii_lowercase(), name.to_ascii_lowercase()))
        .with_context(|| format!("Thunderstore package {namespace}-{name} was not found"))?;
    let selected: &ThunderstoreVersion = package
        .versions
        .iter()
        .find(|item| item.version_number == version)
        .with_context(|| {
            format!("Thunderstore package {namespace}-{name} does not have version {version}")
        })?;
    let resolved_coordinate = if version == requested_version {
        coordinate.to_owned()
    } else {
        format!("{namespace}-{name}-{version}")
    };
    locked.insert(
        identity.clone(),
        LockedPackage {
            coordinate: resolved_coordinate,
            namespace: namespace.to_owned(),
            name: name.to_owned(),
            version: version.to_owned(),
            download_url: selected.download_url.clone(),
            dependencies: selected.dependencies.clone(),
            origins: vec![origin.to_owned()],
            enabled: true,
            files: Vec::new(),
        },
    );
    for dependency in &selected.dependencies {
        visit(
            dependency,
            &format!("dependency:{coordinate}"),
            catalog,
            preferred_loader_version,
            visiting,
            locked,
        )?;
    }
    visiting.remove(&identity);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    fn package(
        owner: &str,
        name: &str,
        version: &str,
        dependencies: &[&str],
    ) -> ThunderstorePackage {
        ThunderstorePackage {
            name: name.into(),
            full_name: format!("{owner}-{name}"),
            owner: owner.into(),
            package_url: String::new(),
            date_updated: String::new(),
            uuid4: String::new(),
            rating_score: 0,
            is_pinned: false,
            is_deprecated: false,
            has_nsfw_content: false,
            categories: vec![],
            versions: vec![ThunderstoreVersion {
                name: name.into(),
                full_name: format!("{owner}-{name}-{version}"),
                description: String::new(),
                icon: String::new(),
                version_number: version.into(),
                dependencies: dependencies.iter().map(|item| item.to_string()).collect(),
                download_url: "https://example.invalid/mod.zip".into(),
                downloads: 0,
                date_created: String::new(),
            }],
        }
    }
    #[test]
    fn resolves_transitive_dependencies() {
        let catalog = vec![
            package("A", "Root", "1.0.0", &["B-Lib-2.0.0"]),
            package("B", "Lib", "2.0.0", &[]),
        ];
        let result = resolve(
            &catalog,
            &[RequestedPackage {
                coordinate: "A-Root-1.0.0".into(),
                origin: "required".into(),
                enabled: true,
            }],
        )
        .unwrap();
        assert_eq!(result.len(), 2);
        assert!(result.contains_key("b-lib"));
    }
    #[test]
    fn rejects_exact_version_conflicts() {
        let catalog = vec![
            package("A", "One", "1.0.0", &["B-Lib-1.0.0"]),
            package("A", "Two", "1.0.0", &["B-Lib-2.0.0"]),
            ThunderstorePackage {
                versions: vec![
                    package("B", "Lib", "1.0.0", &[]).versions[0].clone(),
                    package("B", "Lib", "2.0.0", &[]).versions[0].clone(),
                ],
                ..package("B", "Lib", "1.0.0", &[])
            },
        ];
        let requested = vec![
            RequestedPackage {
                coordinate: "A-One-1.0.0".into(),
                origin: "extra".into(),
                enabled: true,
            },
            RequestedPackage {
                coordinate: "A-Two-1.0.0".into(),
                origin: "extra".into(),
                enabled: true,
            },
        ];
        assert!(resolve(&catalog, &requested)
            .unwrap_err()
            .to_string()
            .contains("Conflicting versions"));
    }
    #[test]
    fn direct_bepinex_pin_overrides_older_transitive_dependency() {
        let catalog = vec![
            package(
                "A",
                "ServerMod",
                "1.0.0",
                &["denikson-BepInExPack_Valheim-5.4.2202"],
            ),
            ThunderstorePackage {
                versions: vec![
                    package("denikson", "BepInExPack_Valheim", "5.4.2333", &[]).versions[0].clone(),
                    package("denikson", "BepInExPack_Valheim", "5.4.2202", &[]).versions[0].clone(),
                ],
                ..package("denikson", "BepInExPack_Valheim", "5.4.2333", &[])
            },
        ];
        let requested = vec![
            RequestedPackage {
                coordinate: "A-ServerMod-1.0.0".into(),
                origin: "required".into(),
                enabled: true,
            },
            RequestedPackage {
                coordinate: "denikson-BepInExPack_Valheim-5.4.2333".into(),
                origin: "required".into(),
                enabled: true,
            },
        ];

        let result = resolve(&catalog, &requested).unwrap();
        let loader = &result[LOADER_IDENTITY];

        assert_eq!(loader.version, "5.4.2333");
        assert_eq!(loader.coordinate, "denikson-BepInExPack_Valheim-5.4.2333");
        assert!(loader.origins.iter().any(|origin| origin == "required"));
    }
    #[test]
    fn rejects_dependency_cycles() {
        let catalog = vec![
            package("A", "One", "1.0.0", &["B-Two-1.0.0"]),
            package("B", "Two", "1.0.0", &["A-One-1.0.0"]),
        ];
        let requested = vec![RequestedPackage {
            coordinate: "A-One-1.0.0".into(),
            origin: "extra".into(),
            enabled: true,
        }];
        assert!(resolve(&catalog, &requested)
            .unwrap_err()
            .to_string()
            .contains("cycle"));
    }
}
