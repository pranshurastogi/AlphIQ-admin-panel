'use client'
import React from 'react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden">
      {/* Animated blobs background */}
      <div className="absolute inset-0 -z-10">
        <div className="pointer-events-none select-none">
          <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-amber-400 opacity-30 rounded-full filter blur-3xl animate-blob1" />
          <div className="absolute top-[60%] left-[60%] w-[500px] h-[500px] bg-mint opacity-20 rounded-full filter blur-3xl animate-blob2" />
          <div className="absolute top-[30%] left-[40%] w-[350px] h-[350px] bg-amber-600 opacity-20 rounded-full filter blur-2xl animate-blob3" />
        </div>
      </div>
      {children}
    </div>
  )
}
