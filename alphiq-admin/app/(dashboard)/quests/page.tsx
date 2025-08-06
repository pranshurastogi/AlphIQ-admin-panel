'use client'

import { useState, useEffect, useRef } from 'react'
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
import { Search, Plus, Edit, Trash2, Info, X, Settings, Image, Link as LinkIcon, Tag, FileText } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import useSWR from 'swr'

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

interface MetaSection {
  id: string
  name: string
  type: 'text' | 'url' | 'image' | 'tags' | 'number' | 'boolean'
  value: any
  required?: boolean
}

export default function QuestsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [role, setRole] = useState<'super_admin'|'sub_admin'|'moderator'|'viewer'>('viewer')
  const [partnerId, setPartnerId] = useState<string>('')

  // SWR fetcher for quests and categories
  const fetchQuestsAndCategories = async () => {
    const [{ data: cats }, { data: qs }] = await Promise.all([
      supabase.from('admin_quest_categories').select('id,name'),
      supabase.from('admin_quests').select('*,admin_quest_categories!inner(name)')
    ])
    return {
      categories: cats || [],
      quests: (qs || []).map((q: any) => ({
        ...q,
        category_name: q.admin_quest_categories.name
      }))
    }
  }
  const { data: swrData, error: swrError, isLoading: swrLoading, mutate } = useSWR('quests-and-categories', fetchQuestsAndCategories, { revalidateOnFocus: false })
  const quests = swrData?.quests || []
  const categories = swrData?.categories || []
  const loading = swrLoading
  const error = swrError

  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Quest|null>(null)
  const [viewing, setViewing] = useState<Quest|null>(null)
  const [metaSections, setMetaSections] = useState<MetaSection[]>([])
  const [showMetaBuilder, setShowMetaBuilder] = useState(false)

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

  // Track last fetch time to prevent auto-refresh on tab switch
  const lastFetchRef = useRef<number>(0)

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

  // Initialize default meta sections
  useEffect(() => {
    if (!metaSections.length) {
      setMetaSections([
        { id: 'icon', name: 'Icon URL', type: 'image', value: '' },
        { id: 'tags', name: 'Tags', type: 'tags', value: [] },
        { id: 'external_link', name: 'External Link', type: 'url', value: '' },
        { id: 'difficulty', name: 'Difficulty', type: 'text', value: '' },
        { id: 'time_estimate', name: 'Time Estimate (minutes)', type: 'number', value: 0 },
        { id: 'featured', name: 'Featured Quest', type: 'boolean', value: false }
      ])
    }
  }, [])

  // 3) Open dialog
  const openNew = () => {
    setEditing(null)
    setForm(blank)
    setMetaSections([
      { id: 'icon', name: 'Icon URL', type: 'image', value: '' },
      { id: 'tags', name: 'Tags', type: 'tags', value: [] },
      { id: 'external_link', name: 'External Link', type: 'url', value: '' },
      { id: 'difficulty', name: 'Difficulty', type: 'text', value: '' },
      { id: 'time_estimate', name: 'Time Estimate (minutes)', type: 'number', value: 0 },
      { id: 'featured', name: 'Featured Quest', type: 'boolean', value: false }
    ])
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
    
    // Convert meta to sections
    const sections: MetaSection[] = [
      { id: 'icon', name: 'Icon URL', type: 'image', value: q.meta?.icon || '' },
      { id: 'tags', name: 'Tags', type: 'tags', value: q.meta?.tags || [] },
      { id: 'external_link', name: 'External Link', type: 'url', value: q.meta?.external_link || '' },
      { id: 'difficulty', name: 'Difficulty', type: 'text', value: q.meta?.difficulty || '' },
      { id: 'time_estimate', name: 'Time Estimate (minutes)', type: 'number', value: q.meta?.time_estimate || 0 },
      { id: 'featured', name: 'Featured Quest', type: 'boolean', value: q.meta?.featured || false }
    ]
    
    // Add any custom meta fields
    if (q.meta) {
      Object.keys(q.meta).forEach(key => {
        if (!sections.find(s => s.id === key)) {
          sections.push({
            id: key,
            name: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
            type: 'text',
            value: q.meta[key]
          })
        }
      })
    }
    
    setMetaSections(sections)
    setDialogOpen(true)
  }

  // Update meta when sections change
  const updateMetaFromSections = (sections: MetaSection[]) => {
    const meta: any = {}
    sections.forEach(section => {
      if (section.value !== '' && section.value !== null && section.value !== undefined) {
        meta[section.id] = section.value
      }
    })
    setForm(f => ({ ...f, meta }))
  }

  // Handle meta section changes
  const updateMetaSection = (id: string, value: any) => {
    const updatedSections = metaSections.map(section => 
      section.id === id ? { ...section, value } : section
    )
    setMetaSections(updatedSections)
    updateMetaFromSections(updatedSections)
  }

  // Add new meta section
  const addMetaSection = () => {
    const newSection: MetaSection = {
      id: `custom_${Date.now()}`,
      name: '',
      type: 'text',
      value: ''
    }
    setMetaSections([...metaSections, newSection])
  }

  // Remove meta section
  const removeMetaSection = (id: string) => {
    const updatedSections = metaSections.filter(section => section.id !== id)
    setMetaSections(updatedSections)
    updateMetaFromSections(updatedSections)
  }

  // Update meta section name
  const updateMetaSectionName = (id: string, name: string) => {
    const updatedSections = metaSections.map(section => 
      section.id === id ? { ...section, name } : section
    )
    setMetaSections(updatedSections)
  }

  // Update meta section type
  const updateMetaSectionType = (id: string, type: MetaSection['type']) => {
    const updatedSections = metaSections.map(section => 
      section.id === id ? { ...section, type, value: type === 'boolean' ? false : type === 'number' ? 0 : type === 'tags' ? [] : '' } : section
    )
    setMetaSections(updatedSections)
    updateMetaFromSections(updatedSections)
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
    
    // Build meta from sections
    const meta: any = {}
    metaSections.forEach(section => {
      if (section.value !== '' && section.value !== null && section.value !== undefined) {
        meta[section.id] = section.value
      }
    })
    
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
      meta:         meta,
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
      mutate() // revalidate SWR cache
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
      mutate() // revalidate SWR cache
    } catch (e:any) {
      console.error(e)
      toast({ title:'Delete failed', description:e.message, variant:'destructive' })
    }
  }

  // 6) Filter
  const list = quests.filter(q=>
    q.title.toLowerCase().includes(search.toLowerCase())
  )

  // Render meta section input based on type
  const renderMetaInput = (section: MetaSection) => {
    switch (section.type) {
      case 'text':
        return (
          <Input
            value={section.value || ''}
            onChange={(e) => updateMetaSection(section.id, e.target.value)}
            placeholder={`Enter ${section.name.toLowerCase()}`}
          />
        )
      case 'url':
        return (
          <Input
            type="url"
            value={section.value || ''}
            onChange={(e) => updateMetaSection(section.id, e.target.value)}
            placeholder="https://example.com"
          />
        )
      case 'image':
        return (
          <Input
            type="url"
            value={section.value || ''}
            onChange={(e) => updateMetaSection(section.id, e.target.value)}
            placeholder="https://example.com/image.png"
          />
        )
      case 'number':
        return (
          <Input
            type="number"
            value={section.value || 0}
            onChange={(e) => updateMetaSection(section.id, parseInt(e.target.value) || 0)}
          />
        )
      case 'boolean':
        return (
          <Switch
            checked={!!section.value}
            onChange={(val) => updateMetaSection(section.id, val)}
            className={`${
              section.value ? 'bg-green-500' : 'bg-gray-400'
            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
          >
            <span className="sr-only">{section.name}</span>
            <span
              className={`${
                section.value ? 'translate-x-6' : 'translate-x-1'
              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
          </Switch>
        )
      case 'tags':
        return (
          <div className="space-y-2">
            <Input
              placeholder="Enter tags separated by commas"
              value={Array.isArray(section.value) ? section.value.join(', ') : ''}
              onChange={(e) => {
                const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                updateMetaSection(section.id, tags)
              }}
            />
            {Array.isArray(section.value) && section.value.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {section.value.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )
      default:
        return <Input value={section.value || ''} onChange={(e) => updateMetaSection(section.id, e.target.value)} />
    }
  }

  return (
    <TooltipProvider>
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
                 <TableRow key={q.id} className="cursor-pointer hover:bg-muted/40 group" onClick={e => {
                   // Prevent row click if clicking on action buttons
                   if ((e.target as HTMLElement).closest('button')) return;
                   setViewing(q)
                 }}>
                   <TableCell className="font-medium group-hover:underline">{q.title}</TableCell>
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
                   <TableCell className="space-x-2" onClick={e => e.stopPropagation()}>
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?'Edit Quest':'New Quest'}</DialogTitle>
            <DialogDescription>
              {editing ? `ID: ${editing.id}` : 'Fill out fields below'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="meta">Meta Data</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
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
                  <Label htmlFor="desc">Description</Label>
                  <Textarea
                    id="desc"
                    rows={4}
                    value={form.description||''}
                    onChange={e=>setForm(f=>({...f,description:e.target.value}))}
                    placeholder="Describe the quest and what users need to do..."
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
              </TabsContent>

              <TabsContent value="meta" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Quest Meta Data</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addMetaSection}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Custom Field
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {metaSections.map((section, index) => (
                    <Card key={section.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-sm font-medium">Field Name</Label>
                            <Input
                              value={section.name}
                              onChange={(e) => updateMetaSectionName(section.id, e.target.value)}
                              placeholder="Field name"
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Type</Label>
                            <Select
                              value={section.type}
                              onValueChange={(value: MetaSection['type']) => updateMetaSectionType(section.id, value)}
                            >
                              <SelectTrigger className="text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="url">URL</SelectItem>
                                <SelectItem value="image">Image URL</SelectItem>
                                <SelectItem value="tags">Tags</SelectItem>
                                <SelectItem value="number">Number</SelectItem>
                                <SelectItem value="boolean">Boolean</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMetaSection(section.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Value</Label>
                        {renderMetaInput(section)}
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
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
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" tabIndex={0} className="ml-1 align-middle cursor-pointer p-0 bg-transparent border-0">
                            <Info size={14}/>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <span>Quest IDs that must be completed before this quest is available. Enter one or more quest IDs, separated by commas.</span>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
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
                  <Label>Comments</Label>
                  <Textarea
                    rows={3}
                    value={form.comments||''}
                    onChange={e=>setForm(f=>({...f,comments:e.target.value}))}
                    placeholder="Internal notes about this quest..."
                  />
                </div>

                {editing && (
                  <div className="text-sm text-neutral-500">
                    Created: {editing.created_at}<br/>
                    Updated: {editing.updated_at}
                  </div>
                )}
              </TabsContent>
            </Tabs>

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

      {/* Quest Detail Dialog */}
      <Dialog open={!!viewing} onOpenChange={open => setViewing(open ? viewing : null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Quest Details</DialogTitle>
            <DialogDescription>
              View all information about this quest.
            </DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{viewing.title}</h2>
                { (role==='super_admin' || (role==='sub_admin' && viewing.partner_id===partnerId)) && (
                  <Button size="sm" variant="outline" onClick={()=>{ setViewing(null); openEdit(viewing); }}>Edit</Button>
                )}
              </div>
              <div className="text-muted-foreground">ID: {viewing.id}</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="font-semibold">Category</div>
                  <Badge>{viewing.category_name}</Badge>
                </div>
                <div>
                  <div className="font-semibold">XP Reward</div>
                  {viewing.xp_reward}
                </div>
                <div>
                  <div className="font-semibold">Multiplier</div>
                  {viewing.multiplier}
                </div>
                <div>
                  <div className="font-semibold">Multiplier Window</div>
                  {viewing.multiplier_start ? viewing.multiplier_start.slice(0,10) : '—'} → {viewing.multiplier_end ? viewing.multiplier_end.slice(0,10) : '—'}
                </div>
                <div>
                  <div className="font-semibold">Start Date</div>
                  {viewing.start_at}
                </div>
                <div>
                  <div className="font-semibold">End Date</div>
                  {viewing.end_at || '—'}
                </div>
                <div>
                  <div className="font-semibold">Active?</div>
                  {viewing.is_active ? <Badge variant="secondary">Yes</Badge> : <Badge variant="outline">No</Badge>}
                </div>
                <div>
                  <div className="font-semibold">Created By</div>
                  {viewing.created_by}
                </div>
                <div>
                  <div className="font-semibold">Partner ID</div>
                  {viewing.partner_id}
                </div>
              </div>
              <div>
                <div className="font-semibold mb-1">Description</div>
                <div className="whitespace-pre-line">{viewing.description}</div>
              </div>
              <div>
                <div className="font-semibold mb-1">Prerequisites</div>
                {viewing.prerequisites && viewing.prerequisites.length
                  ? <div className="flex flex-wrap gap-2">{viewing.prerequisites.map(id => (
                      <Badge key={id} variant="outline">ID: {id}</Badge>
                    ))}</div>
                  : <span className="text-muted-foreground">None</span>}
              </div>
              {viewing.meta && Object.keys(viewing.meta).length > 0 && (
                <div>
                  <div className="font-semibold mb-2">Meta Data</div>
                  <div className="space-y-2">
                    {Object.entries(viewing.meta).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="font-medium text-sm">{key}:</span>
                        {Array.isArray(value) ? (
                          <div className="flex flex-wrap gap-1">
                            {value.map((item, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        ) : typeof value === 'boolean' ? (
                          <Badge variant={value ? "secondary" : "outline"}>
                            {value ? "Yes" : "No"}
                          </Badge>
                        ) : (
                          <span className="text-sm">{String(value)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {viewing.comments && (
                <div>
                  <div className="font-semibold mb-1">Comments</div>
                  <div className="whitespace-pre-line">{viewing.comments}</div>
                </div>
              )}
              <div className="text-xs text-muted-foreground mt-2">
                Created: {viewing.created_at} <br/>
                Updated: {viewing.updated_at}
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={()=>setViewing(null)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  )
}
