"use client";
import {GameServers} from "@/lib/config/servers";
import GameServerCard from "@/components/GameServerCard";
import {useEffect, useState} from "react";
import {ServerStatus} from "@/types/server";

export default function GameServersSection() {
  const [statuses, setStatuses] = useState<ServerStatus[]>([]);

  useEffect(() => {
    fetch('/api/servers').then((res) => res.json()).then(r => {
      const {servers} = r;
      setStatuses(servers);
    }).catch(err => {
      console.log('err', err);
    })
  }, []);

  return <div className="text-left grid grid-cols-1 xl:grid-cols-3 gap-4">
    {GameServers.map((server, index) => {
      const sv = statuses.find(x => x.id === server.id);
      return <GameServerCard key={index} server={sv!}/>
    })}
  </div>
}
