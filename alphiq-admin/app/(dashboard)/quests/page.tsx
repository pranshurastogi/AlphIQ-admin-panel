'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/components/auth-provider'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Switch } from '@headlessui/react'
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent
} from '@/components/ui/card'
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell
} from '@/components/ui/table'
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Edit, Trash2, Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface Quest {
  id: number
  title: string
  description: string
  category_id: number
  category_name: string
  xp_reward: number
  multiplier: number
  multiplier_start: string | null
  multiplier_end: string | null
  partner_id: string
  created_by: string
  start_at: string
  end_at: string | null
  is_active: boolean
  prerequisites: number[]
  meta: any
  comments: string | null
  created_at: string
  updated_at: string
}

interface Category {
  id: number
  name: string
}

export default function QuestsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [role, setRole] = useState<'super_admin'|'sub_admin'|'moderator'|'viewer'>('viewer')
  const [partnerId, setPartnerId] = useState<string>('')

  const [quests, setQuests] = useState<Quest[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Quest|null>(null)

  const blank = {
    title: '',
    description: '',
    category_id: undefined,
    xp_reward: 0,
    multiplier: 1,
    multiplier_start: null,
    multiplier_end: null,
    start_at: new Date().toISOString().slice(0,10),
    end_at: '',
    is_active: true,
    prerequisites: [] as number[],
    meta: {},
    comments: ''
  }
  const [form, setForm] = useState<Partial<Quest>>(blank)
  const [loading, setLoading] = useState(true)

  // 1) Load role & partner_id
  useEffect(() => {
    if (!user) return
    supabase
      .from('admin_user_profiles')
      .select('role,partner_id')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setRole(data.role)
          setPartnerId(data.partner_id)
        }
      })
  }, [user])

  // 2) Fetch categories & quests
  const fetchAll = async() => {
    setLoading(true)
    try {
      const [{ data: cats, error: e1 }, { data: qs, error: e2 }] = await Promise.all([
        supabase.from('admin_quest_categories').select('id,name'),
        supabase.from('admin_quests')
          .select(`
            *,
            admin_quest_categories!inner(name)
          `)
      ])
      if (e1||e2) throw e1||e2
      setCategories(cats||[])
      setQuests((qs||[]).map((q:any)=>({
        ...q,
        category_name: q.admin_quest_categories.name
      })))
    } catch (e:any) {
      console.error(e)
      toast({ title:'Load error', description:e.message, variant:'destructive' })
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { fetchAll() }, [])

  // 3) Open dialog
  const openNew = () => {
    setEditing(null)
    setForm(blank)
    setDialogOpen(true)
  }
  const openEdit = (q:Quest) => {
    setEditing(q)
    setForm({
      ...q,
      end_at: q.end_at||'',
      multiplier_start: q.multiplier_start?.slice(0,19).replace('T',' '),
      multiplier_end:   q.multiplier_end?.slice(0,19).replace('T',' ')
    })
    setDialogOpen(true)
  }

  // 4) Submit (create/update)
  const handleSubmit = async(e:any) => {
    e.preventDefault()
    if (!form.title||!form.category_id) {
      return toast({
        title:'Validation',
        description:'Title & Category required',
        variant:'destructive'
      })
    }
    const payload = {
      title:        form.title,
      description:  form.description,
      category_id:  form.category_id,
      xp_reward:    form.xp_reward,
      multiplier:   form.multiplier,
      multiplier_start: form.multiplier_start || null,
      multiplier_end:   form.multiplier_end || null,
      partner_id:   partnerId,
      created_by:   user!.id,
      start_at:     form.start_at,
      end_at:       form.end_at || null,
      is_active:    form.is_active,
      prerequisites: Array.isArray(form.prerequisites) ? form.prerequisites : [],
      meta:         form.meta,
      comments:     form.comments
    }
    try {
      let res
      if (editing) {
        res = await supabase
          .from('admin_quests')
          .update(payload)
          .eq('id', editing.id)
      } else {
        res = await supabase
          .from('admin_quests')
          .insert([payload])
      }
      if (res.error) throw res.error
      toast({
        title: editing?'Quest updated':'Quest created',
        description: editing?`#${editing.id}`:'new quest'
      })
      setDialogOpen(false)
      fetchAll()
    } catch (e:any) {
      console.error(e)
      toast({ title:'Save failed', description:e.message, variant:'destructive' })
    }
  }

  // 5) Delete
  const handleDelete = async(q:Quest) => {
    if (!confirm(`Delete quest #${q.id}?`)) return
    try {
      const { error } = await supabase
        .from('admin_quests')
        .delete()
        .eq('id', q.id)
      if (error) throw error
      toast({ title:'Deleted', description:`#${q.id}` })
      fetchAll()
    } catch (e:any) {
      console.error(e)
      toast({ title:'Delete failed', description:e.message, variant:'destructive' })
    }
  }

  // 6) Filter
  const list = quests.filter(q=>
    q.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quests</h1>
          <p className="text-muted-foreground">Manage and configure your quests</p>
        </div>
        {(role==='super_admin'||role==='sub_admin') && (
          <Button onClick={openNew}>
            <Plus className="mr-2"/>New Quest
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search…"
          value={search}
          onChange={e=>setSearch(e.target.value)}
          className="flex-1"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Quests</CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>XP</TableHead>
                <TableHead>Active?</TableHead>
                <TableHead>Window</TableHead>
                <TableHead>Prereqs</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map(q=>{
                const canEdit =
                  role==='super_admin' ||
                  (role==='sub_admin' && q.partner_id===partnerId)
                return (
                  <TableRow key={q.id}>
                    <TableCell>{q.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{q.category_name}</Badge>
                    </TableCell>
                    <TableCell>{q.xp_reward}</TableCell>
                    <TableCell>
                      {q.is_active
                        ? <Badge variant="secondary">Yes</Badge>
                        : <Badge variant="outline">No</Badge>}
                    </TableCell>
                    <TableCell>
                      {q.start_at} → {q.end_at||'–'}
                    </TableCell>
                    <TableCell>
                      {q.prerequisites.length? q.prerequisites.join(','):'None'}
                    </TableCell>
                    <TableCell className="space-x-2">
                      {canEdit
                        ? <>
                            <Button size="sm" variant="ghost" onClick={()=>openEdit(q)}>
                              <Edit/>
                            </Button>
                            <Button size="sm" variant="ghost" onClick={()=>handleDelete(q)}>
                              <Trash2/>
                            </Button>
                          </>
                        : <span className="text-sm text-muted-foreground">—</span>}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing?'Edit Quest':'New Quest'}</DialogTitle>
            <DialogDescription>
              {editing ? `ID: ${editing.id}` : 'Fill out fields below'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title*</Label>
                <Input
                  id="title"
                  value={form.title||''}
                  onChange={e=>setForm(f=>({...f,title:e.target.value}))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">Category*</Label>
                <Select
                  value={String(form.category_id||'')}
                  onValueChange={v=>setForm(f=>({...f,category_id: +v}))}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Pick…"/>
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c=>(
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="desc">
                Description
              </Label>
              <Textarea
                id="desc"
                rows={4}
                value={form.description||''}
                onChange={e=>setForm(f=>({...f,description:e.target.value}))}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="xp">XP Reward</Label>
                <Input
                  id="xp"
                  type="number"
                  step="1"
                  value={form.xp_reward||0}
                  onChange={e=>setForm(f=>({...f,xp_reward:+e.target.value}))}
                />
              </div>
              <div>
                <Label htmlFor="mult">Multiplier</Label>
                <Input
                  id="mult"
                  type="number"
                  step="0.1"
                  value={form.multiplier||1}
                  onChange={e=>setForm(f=>({...f,multiplier:+e.target.value}))}
                />
              </div>
              <div className="flex items-center mt-5">
                <Switch
                  checked={!!form.is_active}
                  onChange={val=>setForm(f=>({...f,is_active:val}))}
                  className={`${
                    form.is_active ? 'bg-green-500' : 'bg-gray-400'
                  } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                >
                  <span className="sr-only">Active?</span>
                  <span
                    className={`${
                      form.is_active ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </Switch>
                <span className="ml-2 text-sm">Active</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Multiplier Start
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="ml-1 align-middle cursor-pointer"><Info size={14}/></span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <span>When the XP multiplier for this quest begins. Use to create time-limited bonus periods.</span>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  type="date"
                  value={form.multiplier_start ? form.multiplier_start.slice(0,10) : ''}
                  onChange={e=>setForm(f=>({...f,multiplier_start:e.target.value}))}
                />
              </div>
              <div>
                <Label>Multiplier End
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="ml-1 align-middle cursor-pointer"><Info size={14}/></span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <span>When the XP multiplier for this quest ends. Leave blank for no end.</span>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  type="date"
                  value={form.multiplier_end ? form.multiplier_end.slice(0,10) : ''}
                  onChange={e=>setForm(f=>({...f,multiplier_end:e.target.value}))}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Start At</Label>
                <Input
                  type="date"
                  value={form.start_at||''}
                  onChange={e=>setForm(f=>({...f,start_at:e.target.value}))}
                  required
                />
              </div>
              <div>
                <Label>End At</Label>
                <Input
                  type="date"
                  value={form.end_at||''}
                  onChange={e=>setForm(f=>({...f,end_at:e.target.value}))}
                />
              </div>
              <div>
                <Label>Prereqs
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="ml-1 align-middle cursor-pointer"><Info size={14}/></span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <span>Quest IDs that must be completed before this quest is available. Enter one or more quest IDs, separated by commas. (A multi-select UI can be implemented if needed.)</span>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                {/* TODO: Replace with a true multi-select if available in your UI library */}
                <Input
                  placeholder="1,2,5"
                  value={(form.prerequisites||[]).join(',')}
                  onChange={e=>{
                    const arr = e.target.value
                      .split(',')
                      .map(x=>parseInt(x,10))
                      .filter(n=>!isNaN(n))
                    setForm(f=>({...f,prerequisites:arr}))
                  }}
                />
              </div>
            </div>

            <div>
              <Label>Meta (JSON)
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="ml-1 align-middle cursor-pointer"><Info size={14}/></span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <span>
                        Stores any extra, free-form data you might want to attach to a quest:<br/>
                        – Icons or image URLs<br/>
                        – Tags or categories beyond the single category_id (e.g. ["defi","nft","twitter"])<br/>
                        – Links to external docs or guides<br/>
                        – Anything else that doesn’t merit its own strongly-typed column<br/>
                        <br/>
                        Because it’s JSONB, you can index particular keys or even add a GIN index over the whole JSON if you need to query on, say, meta-&gt;&gt;'tags'.
                      </span>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Textarea
                rows={3}
                value={typeof form.meta === 'string' ? form.meta : JSON.stringify(form.meta,null,2)}
                onChange={e=>{
                  try {
                    setForm(f=>({...f,meta:JSON.parse(e.target.value)}))
                  } catch {
                    setForm(f=>({...f,meta:e.target.value}))
                  }
                }}
              />
            </div>

            <div>
              <Label>Comments</Label>
              <Textarea
                rows={2}
                value={form.comments||''}
                onChange={e=>setForm(f=>({...f,comments:e.target.value}))}
              />
            </div>

            {editing && (
              <div className="text-sm text-neutral-500">
                Created: {editing.created_at}<br/>
                Updated: {editing.updated_at}
              </div>
            )}

            <DialogFooter className="space-x-2">
              <Button variant="outline" onClick={()=>setDialogOpen(false)} type="button">
                Cancel
              </Button>
              <Button type="submit">
                {editing ? 'Save Changes' : 'Create Quest'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
