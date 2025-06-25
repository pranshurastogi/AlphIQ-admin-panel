"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Level {
  id: string
  level: number
  xpMin: number
  xpMax: number
  title: string
  color: string
}

const mockLevels: Level[] = [
  { id: "1", level: 1, xpMin: 0, xpMax: 999, title: "Newcomer", color: "#6B7280" },
  { id: "2", level: 2, xpMin: 1000, xpMax: 2499, title: "Explorer", color: "#10B981" },
  { id: "3", level: 3, xpMin: 2500, xpMax: 4999, title: "Adventurer", color: "#3B82F6" },
  { id: "4", level: 4, xpMin: 5000, xpMax: 9999, title: "Veteran", color: "#8B5CF6" },
  { id: "5", level: 5, xpMin: 10000, xpMax: 19999, title: "Expert", color: "#F59E0B" },
  { id: "6", level: 6, xpMin: 20000, xpMax: 39999, title: "Master", color: "#EF4444" },
  { id: "7", level: 7, xpMin: 40000, xpMax: 79999, title: "Grandmaster", color: "#EC4899" },
  { id: "8", level: 8, xpMin: 80000, xpMax: 159999, title: "Legend", color: "#FFC700" },
  { id: "9", level: 9, xpMin: 160000, xpMax: 999999, title: "Mythic", color: "#00E6B0" },
]

export default function LevelsPage() {
  const [levels, setLevels] = useState<Level[]>(mockLevels)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingLevel, setEditingLevel] = useState<Level | null>(null)
  const [formData, setFormData] = useState({
    level: 0,
    xpMin: 0,
    xpMax: 0,
    title: "",
    color: "#00E6B0",
  })
  const { toast } = useToast()

  const validateLevel = (newLevel: Partial<Level>, excludeId?: string) => {
    const otherLevels = levels.filter((l) => l.id !== excludeId)

    // Check for overlaps
    for (const level of otherLevels) {
      if (
        (newLevel.xpMin! >= level.xpMin && newLevel.xpMin! <= level.xpMax) ||
        (newLevel.xpMax! >= level.xpMin && newLevel.xpMax! <= level.xpMax) ||
        (newLevel.xpMin! <= level.xpMin && newLevel.xpMax! >= level.xpMax)
      ) {
        return `XP range overlaps with Level ${level.level} (${level.xpMin}-${level.xpMax})`
      }
    }

    if (newLevel.xpMin! >= newLevel.xpMax!) {
      return "Minimum XP must be less than maximum XP"
    }

    return null
  }

  const handleCreate = () => {
    const error = validateLevel(formData)
    if (error) {
      toast({
        title: "Validation Error",
        description: error,
        variant: "destructive",
      })
      return
    }

    const newLevel: Level = {
      id: Date.now().toString(),
      ...formData,
    }

    setLevels([...levels, newLevel].sort((a, b) => a.level - b.level))
    setFormData({ level: 0, xpMin: 0, xpMax: 0, title: "", color: "#00E6B0" })
    setIsCreateOpen(false)
    toast({
      title: "Level created",
      description: `Level ${formData.level} "${formData.title}" has been created.`,
    })
  }

  const handleEdit = (level: Level) => {
    setEditingLevel(level)
    setFormData({
      level: level.level,
      xpMin: level.xpMin,
      xpMax: level.xpMax,
      title: level.title,
      color: level.color,
    })
  }

  const handleUpdate = () => {
    if (!editingLevel) return

    const error = validateLevel(formData, editingLevel.id)
    if (error) {
      toast({
        title: "Validation Error",
        description: error,
        variant: "destructive",
      })
      return
    }

    setLevels(
      levels
        .map((level) => (level.id === editingLevel.id ? { ...level, ...formData } : level))
        .sort((a, b) => a.level - b.level),
    )
    setEditingLevel(null)
    setFormData({ level: 0, xpMin: 0, xpMax: 0, title: "", color: "#00E6B0" })
    toast({
      title: "Level updated",
      description: `Level ${formData.level} has been updated.`,
    })
  }

  const handleDelete = (level: Level) => {
    setLevels(levels.filter((l) => l.id !== level.id))
    toast({
      title: "Level deleted",
      description: `Level ${level.level} "${level.title}" has been deleted.`,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary">XP Levels Configuration</h1>
          <p className="text-muted-foreground">Define XP thresholds and level progression</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Create Level
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-white/10">
            <DialogHeader>
              <DialogTitle className="text-primary">Create New Level</DialogTitle>
              <DialogDescription>Define a new XP level with thresholds and styling.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="level">Level Number</Label>
                  <Input
                    id="level"
                    type="number"
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: Number.parseInt(e.target.value) || 0 })}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Expert"
                    className="bg-white/5 border-white/10"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="xpMin">Minimum XP</Label>
                  <Input
                    id="xpMin"
                    type="number"
                    value={formData.xpMin}
                    onChange={(e) => setFormData({ ...formData, xpMin: Number.parseInt(e.target.value) || 0 })}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div>
                  <Label htmlFor="xpMax">Maximum XP</Label>
                  <Input
                    id="xpMax"
                    type="number"
                    value={formData.xpMax}
                    onChange={(e) => setFormData({ ...formData, xpMax: Number.parseInt(e.target.value) || 0 })}
                    className="bg-white/5 border-white/10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="color">Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-16 h-10 bg-white/5 border-white/10"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#00E6B0"
                    className="bg-white/5 border-white/10"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!formData.title || formData.level === 0}>
                Create Level
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Level Visualization */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-xl font-heading text-primary">Level Progression</CardTitle>
          <CardDescription>Visual representation of XP level bands</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {levels.map((level) => (
              <div key={level.id} className="flex items-center gap-4">
                <div className="w-16 text-center">
                  <Badge
                    variant="outline"
                    style={{ backgroundColor: `${level.color}20`, borderColor: level.color, color: level.color }}
                  >
                    L{level.level}
                  </Badge>
                </div>
                <div className="flex-1">
                  <div
                    className="h-8 rounded-lg flex items-center px-4 text-white font-medium"
                    style={{ backgroundColor: level.color }}
                  >
                    <span>{level.title}</span>
                    <span className="ml-auto text-sm opacity-90">
                      {level.xpMin.toLocaleString()} - {level.xpMax.toLocaleString()} XP
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Levels Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-xl font-heading text-primary">Level Configuration</CardTitle>
          <CardDescription>Manage XP thresholds and level properties</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead>Level</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>XP Range</TableHead>
                <TableHead>Color</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {levels.map((level) => (
                <TableRow key={level.id} className="border-white/10 hover:bg-white/5">
                  <TableCell>
                    <Badge
                      variant="outline"
                      style={{ backgroundColor: `${level.color}20`, borderColor: level.color, color: level.color }}
                    >
                      Level {level.level}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{level.title}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {level.xpMin.toLocaleString()} - {level.xpMax.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full border border-white/20"
                        style={{ backgroundColor: level.color }}
                      />
                      <span className="font-mono text-xs">{level.color}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(level)}
                        className="hover:bg-primary/10 hover:text-primary"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(level)}
                        className="hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingLevel} onOpenChange={() => setEditingLevel(null)}>
        <DialogContent className="glass-card border-white/10">
          <DialogHeader>
            <DialogTitle className="text-primary">Edit Level</DialogTitle>
            <DialogDescription>Update level configuration and properties.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-level">Level Number</Label>
                <Input
                  id="edit-level"
                  type="number"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: Number.parseInt(e.target.value) || 0 })}
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-white/5 border-white/10"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-xpMin">Minimum XP</Label>
                <Input
                  id="edit-xpMin"
                  type="number"
                  value={formData.xpMin}
                  onChange={(e) => setFormData({ ...formData, xpMin: Number.parseInt(e.target.value) || 0 })}
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div>
                <Label htmlFor="edit-xpMax">Maximum XP</Label>
                <Input
                  id="edit-xpMax"
                  type="number"
                  value={formData.xpMax}
                  onChange={(e) => setFormData({ ...formData, xpMax: Number.parseInt(e.target.value) || 0 })}
                  className="bg-white/5 border-white/10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-color">Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="edit-color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-16 h-10 bg-white/5 border-white/10"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="bg-white/5 border-white/10"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingLevel(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={!formData.title || formData.level === 0}>
              Update Level
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
