/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import {useEffect, useState} from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, BookOpen, Users, ArrowRight } from 'lucide-react';
import { PrimaryButton } from '@/components/ui/primary-button';

export default function HomePage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user){
      try{
        const userData = JSON.parse(user);
        const role = userData.role;
        
        const roleRoutes = {
          ADMIN: '/admin/dashboard',
          DOSEN: '/dosen/dashboard',
          MAHASISWA: '/mahasiswa/dashboard',
          KEUANGAN: '/keuangan/dashboard',
        }
        
        const route = roleRoutes[role as keyof typeof roleRoutes] || '/login';
        router.push(route);
      } catch (error) {
        setIsChecking(false);
      }
    } else{
      setIsChecking(false);
    }
  }, [router]);

  if(isChecking){
    return(
      <div className='flex min-h-screen items-center justify-center'>
        <div className='text-center'>
          <div className='mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent'>
            <p className='text-sm text-muted-foreground'>
              Memuat....
            </p>
          </div>
        </div>
      </div>
    )
  }

  return(
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'>
      {/* Header Section */}
      <header className='border-b bg-white/80 backdrop-blur-sm'>
        <div className='container mx-auto flex h-16 items-center justify-between px-4'>
          <div className='flex items-center gap-3'>
            {/* ✅ LOGO IMAGE */}
            <div className='relative h-10 w-10 shrink-0'>
              <Image
                src="/LOGO.png"
                alt="STT Diakonos Logo"
                fill
                className='object-contain'
                priority
              />
            </div>
            <div>
              <h1 className='text-lg font-bold text-blue-600'>SIAKAD</h1>
              <p className='text-xs text-muted-foreground'>STT DIAKONOS</p>
            </div>
          </div>
          <PrimaryButton onClick={() => router.push('/login')}>
            Masuk <ArrowRight className='ml-2 h-4 w-4' />
          </PrimaryButton>
        </div>
      </header>

      {/* Hero Section */}
      <section className='container mx-auto px-4 py-16 text-center'>
        <div className='mx-auto max-w-3xl'>
          {/* ✅ LARGE LOGO */}
          <div className='relative mx-auto mb-8 h-32 w-32'>
            <Image
              src="/LOGO.png"
              alt="STT Diakonos Logo"
              fill
              className='object-contain drop-shadow-lg'
              priority
            />
          </div>
          
          <h2 className='mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl'>
            Sistem Informasi Akademik
          </h2>
          <p className='mb-8 text-xl text-gray-600'>
            Sekolah Tinggi Teologi Diakonos Banyumas
          </p>
          <PrimaryButton onClick={() => router.push('/login')}>
            Masuk Ke Sistem
            <ArrowRight className="ml-2 h-4 w-4" />
          </PrimaryButton>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <Users className="mb-2 h-10 w-10 text-primary" />
              <CardTitle>Untuk Mahasiswa</CardTitle>
              <CardDescription>
                Akses KRS, jadwal kuliah, dan KHS secara online
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <BookOpen className="mb-2 h-10 w-10 text-primary" />
              <CardTitle>Untuk Dosen</CardTitle>
              <CardDescription>
                Input nilai dan monitoring mahasiswa bimbingan
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <GraduationCap className="mb-2 h-10 w-10 text-primary" />
              <CardTitle>Untuk Admin</CardTitle>
              <CardDescription>
                Kelola data akademik dan approval KRS
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>© 2025 STT Diakonos Banyumas. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}