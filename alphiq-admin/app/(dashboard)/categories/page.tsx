// app/(dashboard)/categories/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/components/auth-provider'
import { useToast } from '@/hooks/use-toast'
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent
} from '@/components/ui/card'
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogTrigger, DialogContent,
  DialogHeader, DialogTitle, DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, Search } from 'lucide-react'

interface Category {
  id:          number
  name:        string
  description: string | null
  questCount:  number
  createdAt:   string
}

export default function CategoriesPage() {
  const { user }      = useAuth()
  const { toast }     = useToast()

  const [role, setRole]           = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [filtered, setFiltered]     = useState<Category[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)

  // dialog & form state
  const [isCreateOpen, setIsCreateOpen]       = useState(false)
  const [editing, setEditing]                 = useState<Category | null>(null)
  const [formData, setFormData]               = useState({ name: '', description: '' })
  const [isSubmitting, setIsSubmitting]       = useState(false)

  // 1) fetch current user's role
  useEffect(() => {
    if (!user) return
    supabase
      .from('admin_user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error('[Categories] could not load role', error)
          setRole(null)
        } else {
          setRole(data?.role ?? null)
        }
      })
  }, [user])

  // 2) load categories + counts
  async function fetchCategories() {
    setLoading(true)
    setError(null)
    try {
      // 2a) get raw list
      const { data: cats, error: catsErr } = await supabase
        .from<Omit<Category,'questCount'> & { created_at:string }>('admin_quest_categories')
        .select('id,name,description,created_at')
        .order('created_at', { ascending: false })
      if (catsErr) throw catsErr

      // 2b) for each, fetch quest count (head:true for count only)
      const withCounts: Category[] = await Promise.all(
        cats.map(async (c) => {
          const { count, error: cntErr } = await supabase
            .from('admin_quests')
            .select('id', { count: 'exact', head: true })
            .eq('category_id', c.id)
          if (cntErr) {
            console.error('[Categories] count error for', c.id, cntErr)
          }
          return {
            id:         c.id,
            name:       c.name,
            description:c.description,
            questCount: count ?? 0,
            createdAt:  c.created_at.slice(0,10)
          }
        })
      )

      setCategories(withCounts)
      setFiltered(withCounts)
    } catch (e:any) {
      console.error('[Categories] fetch failed', e)
      setError('Could not load categories')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  // 3) filter on search
  useEffect(() => {
    const term = searchTerm.toLowerCase()
    setFiltered(
      categories.filter(c =>
        c.name.toLowerCase().includes(term) ||
        (c.description ?? '').toLowerCase().includes(term)
      )
    )
  }, [searchTerm, categories])

  // 4) Create handler
  const handleCreate = async () => {
    if (role !== 'super_admin') {
      toast({ title: 'Forbidden', description: 'Only super_admin can create', variant: 'destructive' })
      return
    }
    if (!formData.name.trim()) {
      toast({ title: 'Validation', description: 'Name is required', variant: 'destructive' })
      return
    }
    setIsSubmitting(true)
    console.log('[Categories] create', formData)
    try {
      const { error: insErr } = await supabase
        .from('admin_quest_categories')
        .insert({
          name:        formData.name.trim(),
          description: formData.description || '',
          created_by:  user!.id
        })
      if (insErr) throw insErr

      toast({ title: 'Created', description: `Category "${formData.name}" created.` })
      setIsCreateOpen(false)
      setFormData({ name:'', description:'' })
      await fetchCategories()
    } catch (e:any) {
      console.error('[Categories] create failed', e)
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 5) Update handler
  const handleUpdate = async () => {
    if (!editing || role !== 'super_admin') return
    if (!formData.name.trim()) {
      toast({ title: 'Validation', description: 'Name is required', variant: 'destructive' })
      return
    }
    setIsSubmitting(true)
    console.log('[Categories] update', editing.id, formData)
    try {
      const { error: updErr } = await supabase
        .from('admin_quest_categories')
        .update({
          name:        formData.name.trim(),
          description: formData.description || '',
          updated_at:  new Date().toISOString()
        })
        .eq('id', editing.id)
      if (updErr) throw updErr

      toast({ title: 'Updated', description: `Category "${formData.name}" saved.` })
      setEditing(null)
      setFormData({ name:'', description:'' })
      await fetchCategories()
    } catch (e:any) {
      console.error('[Categories] update failed', e)
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 6) Delete handler
  const handleDelete = async (cat: Category) => {
    if (role !== 'super_admin') {
      toast({ title: 'Forbidden', description: 'Only super_admin can delete', variant: 'destructive' })
      return
    }
    if (cat.questCount > 0) {
      toast({
        title: 'Cannot delete',
        description: `"${cat.name}" has ${cat.questCount} quests.`,
        variant: 'destructive'
      })
      return
    }
    if (!confirm(`Really delete "${cat.name}"?`)) return

    console.log('[Categories] delete', cat.id)
    try {
      const { error: delErr } = await supabase
        .from('admin_quest_categories')
        .delete()
        .eq('id', cat.id)
      if (delErr) throw delErr

      toast({ title: 'Deleted', description: `Category "${cat.name}" removed.` })
      await fetchCategories()
    } catch (e:any) {
      console.error('[Categories] delete failed', e)
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  if (loading) return <p className="py-8 text-center">Loading categories…</p>
  if (error)   return <p className="py-8 text-center text-red-400">{error}</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quest Categories</h1>
          <p className="text-muted-foreground">Manage and organize your quests by category</p>
        </div>
        {role === 'super_admin' && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2"/>Create Category</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Category</DialogTitle>
                <DialogDescription>Add a new category</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cat-name">Name</Label>
                  <Input
                    id="cat-name"
                    placeholder="e.g. DeFi"
                    value={formData.name}
                    onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="cat-desc">Description</Label>
                  <Textarea
                    id="cat-desc"
                    placeholder="Describe this category…"
                    value={formData.description}
                    onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={isSubmitting || !formData.name.trim()}>
                  {isSubmitting ? 'Saving…' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>All Categories</CardTitle>
          <CardDescription>Categories & how many quests each contains</CardDescription>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground"/>
            <Input
              placeholder="Search categories…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Quests</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(cat => (
                <TableRow key={cat.id}>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell>{cat.description}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{cat.questCount}</Badge>
                  </TableCell>
                  <TableCell>{cat.createdAt}</TableCell>
                  <TableCell className="text-right space-x-2">
                    {role === 'super_admin' ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditing(cat)
                            setFormData({ name: cat.name, description: cat.description ?? '' })
                          }}
                        >
                          <Edit className="h-4 w-4"/>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(cat)}
                          disabled={cat.questCount > 0}
                        >
                          <Trash2 className="h-4 w-4"/>
                        </Button>
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editing && role === 'super_admin' && (
        <Dialog open={!!editing} onOpenChange={() => { setEditing(null); setFormData({ name:'',description:''}) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>Modify name or description</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-desc">Description</Label>
                <Textarea
                  id="edit-desc"
                  value={formData.description}
                  onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={isSubmitting || !formData.name.trim()}>
                {isSubmitting ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
