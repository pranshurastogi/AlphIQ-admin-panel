"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"
import { ForgotPasswordForm } from '@/components/ForgotPasswordForm'

export default function ResetPasswordPage({ searchParams }: { searchParams: { token?: string } }) {
  return <ForgotPasswordForm mode="reset" token={searchParams.token} />
}
