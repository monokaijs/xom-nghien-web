import {NextResponse} from 'next/server';
import {contact} from "@/lib/config/contact";

interface ContactConfig {
  email: string;
  phone: string;
  supportHours: string;
  responseTime: string;
  socialMedia: {
    discord: string;
    facebook: string;
    telegram: string;
  };
}

interface ContactResponse {
  contact: ContactConfig;
}


export async function GET() {
  try {

    const response: ContactResponse = {
      contact
    };

    const nextResponse = NextResponse.json(response);
    nextResponse.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

    return nextResponse;
  } catch (error) {
    console.error('Error in contact API:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch contact information',
        contact: {
          email: 'teamthecheckmate@gmail.com',
          phone: '',
          supportHours: '24/7',
          responseTime: 'Trong vòng 24 giờ',
          socialMedia: {
            discord: '',
            facebook: '',
            telegram: ''
          }
        }
      },
      {status: 500}
    );
  }
}
