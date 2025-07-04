// app/(dashboard)/levels/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/components/auth-provider'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2 } from 'lucide-react'

type Level = {
  level:     number
  name:      string
  xp_min:    number
  xp_max:    number
  color_hex: string
}

export default function LevelsPage() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [levels,    setLevels]    = useState<Level[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string|null>(null)
  const [role,      setRole]      = useState<string|null>(null)

  // single form/dialog state
  const emptyForm: Level = { level:0, name:'', xp_min:0, xp_max:0, color_hex:'#00E6B0' }
  const [form,      setForm]      = useState<Level>(emptyForm)
  const [mode,      setMode]      = useState<'create'|'edit'|null>(null)
  const [submitting,setSubmitting]= useState(false)

  // fetch my admin role
  useEffect(() => {
    if (!user) return
    supabase
      .from('admin_user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error) console.error('[Levels] role fetch', error)
        else       setRole(data?.role ?? null)
      })
  }, [user])

  // load levels
  const fetchLevels = async () => {
    setLoading(true); setError(null)
    try {
      const { data, error } = await supabase
        .from('admin_xp_levels')
        .select('*').order('level', { ascending: true })
      if (error) throw error
      setLevels(data || [])
    } catch (e:any) {
      console.error('[Levels] fetch', e)
      setError('Could not load levels')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { fetchLevels() }, [])

  // overlap + sanity validation
  const validate = (v: Level): string|null => {
    if (v.level <= 0)              return 'Level must be > 0'
    if (v.xp_min >= v.xp_max)      return 'Min XP must be < Max XP'
    for (const l of levels) {
      if (mode==='edit' && l.level===form.level) continue
      if (
        (v.xp_min <= l.xp_max && v.xp_min >= l.xp_min) ||
        (v.xp_max <= l.xp_max && v.xp_max >= l.xp_min) ||
        (v.xp_min <= l.xp_min && v.xp_max >= l.xp_max)
      ) {
        return `XP range overlaps Level ${l.level} (${l.xp_min}–${l.xp_max})`
      }
    }
    return null
  }

  // create or update
  const handleSubmit = async () => {
    if (role !== 'super_admin') {
      toast({ title: 'Forbidden', description: 'Only super_admin can do that', variant: 'destructive' })
      return
    }
    const err = validate(form)
    if (err) {
      toast({ title:'Validation', description:err, variant:'destructive' })
      return
    }
    setSubmitting(true)
    try {
      if (mode === 'create') {
        await supabase.from('admin_xp_levels').insert([form]).throwOnError()
        toast({ title: 'Created', description: `Level ${form.level} created.` })
      } else {
        await supabase
          .from('admin_xp_levels')
          .update({
            name:      form.name,
            xp_min:    form.xp_min,
            xp_max:    form.xp_max,
            color_hex: form.color_hex
          })
          .eq('level', form.level)
          .throwOnError()
        toast({ title: 'Updated', description: `Level ${form.level} updated.` })
      }
      fetchLevels()
      setMode(null)
    } catch (e:any) {
      console.error('[Levels] submit', e)
      toast({ title:'Error', description:e.message, variant:'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  // delete
  const handleDelete = async (lvl: Level) => {
    if (role !== 'super_admin') {
      toast({ title: 'Forbidden', description: 'Only super_admin can delete', variant: 'destructive' })
      return
    }
    if (!confirm(`Delete Level ${lvl.level}?`)) return
    try {
      await supabase.from('admin_xp_levels').delete().eq('level',lvl.level).throwOnError()
      toast({ title:'Deleted', description:`Level ${lvl.level} deleted.` })
      fetchLevels()
    } catch (e:any) {
      console.error('[Levels] delete', e)
      toast({ title:'Error', description:e.message, variant:'destructive' })
    }
  }

  if (loading) return <p className="py-8 text-center">Loading…</p>
  if (error)   return <p className="py-8 text-center text-red-400">{error}</p>

  return (
    <div className="space-y-6">

      {/* View-only banner */}
      {role!=='super_admin' && (
        <p className="p-3 bg-yellow-600/10 text-yellow-400 rounded">
          View-only — only <strong>super_admin</strong> can edit.
        </p>
      )}

      {/* Header & New button */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">XP Levels</h1>
          <p className="text-sm text-neutral-500">Map XP to Levels</p>
        </div>
        {role==='super_admin' && (
          <Dialog
            open={mode!==null}
            onOpenChange={o => {
              console.log('[Dialog] onOpenChange', o, 'mode:', mode)
              if (!o) setMode(null)
            }}
          >
            <Button
              variant="default"
              onClick={() => {
                console.log('[Create] Clicked')
                setMode('create')
                setForm(emptyForm)
              }}
            >
              <Plus className="mr-2" /> New Level
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {mode==='create' ? 'Create Level' : `Edit Level ${form.level}`}
                </DialogTitle>
                <DialogDescription>
                  {mode==='create'
                    ? 'Fill in details'
                    : 'Update the fields and save.'}
                </DialogDescription>
              </DialogHeader>

              {/* Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Level #</Label>
                    <Input
                      type="number"
                      value={form.level}
                      onChange={e=>setForm({...form,level:+e.target.value})}
                      disabled={mode==='edit'}
                    />
                  </div>
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={form.name}
                      onChange={e=>setForm({...form,name:e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>XP Min</Label>
                    <Input
                      type="number"
                      value={form.xp_min}
                      onChange={e=>setForm({...form,xp_min:+e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>XP Max</Label>
                    <Input
                      type="number"
                      value={form.xp_max}
                      onChange={e=>setForm({...form,xp_max:+e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <Label>Color</Label>
                  <Input
                    type="color"
                    value={form.color_hex}
                    onChange={e=>setForm({...form,color_hex:e.target.value})}
                  />
                </div>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting
                    ? 'Saving…'
                    : mode==='create'
                      ? 'Create'
                      : 'Save Changes'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Levels table */}
      <Card>
        <CardHeader>
          <CardTitle>Configured Levels</CardTitle>
          <CardDescription>XP ↔ Level table</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Level</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>XP Range</TableHead>
                <TableHead>Color</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {levels.map(l=>(
                <TableRow key={l.level}>
                  <TableCell>
                    <Badge style={{
                      backgroundColor:`${l.color_hex}20`,
                      borderColor:l.color_hex,
                      color:l.color_hex
                    }}>L{l.level}</Badge>
                  </TableCell>
                  <TableCell>{l.name}</TableCell>
                  <TableCell>{l.xp_min.toLocaleString()} – {l.xp_max.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full" style={{backgroundColor:l.color_hex}}/>
                      {l.color_hex}
                    </div>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {role==='super_admin' ? (
                      <>
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => {
                            console.log('[Edit] Clicked', l)
                            setMode('edit')
                            setForm(l)
                          }}
                        >
                          <Edit/>
                        </Button>
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => handleDelete(l)}
                        >
                          <Trash2/>
                        </Button>
                      </>
                    ) : (
                      <span className="text-sm text-neutral-500">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
