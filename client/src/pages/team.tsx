import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Plus, CheckCircle, Clock, AlertTriangle, Upload, Eye } from "lucide-react";
import type { TeamTask, User } from "@shared/schema";
import type { UploadResult } from "@uppy/core";

interface TaskWithUsers extends TeamTask {
  assignedByUser: User;
  assignedToUser: User;
}

export default function TeamPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAssignTask, setShowAssignTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWithUsers | null>(null);
  const [showCompleteTask, setShowCompleteTask] = useState(false);
  const [viewMode, setViewMode] = useState<'assigned' | 'created'>('assigned');

  // Fetch team tasks
  const { data: assignedTasks = [], isLoading: assignedLoading } = useQuery({
    queryKey: ['/api/team-tasks', { assigned: true }],
    queryFn: () => apiRequest('/api/team-tasks?assigned=true'),
  });

  const { data: createdTasks = [], isLoading: createdLoading } = useQuery({
    queryKey: ['/api/team-tasks', { assigned: false }],
    queryFn: () => apiRequest('/api/team-tasks?assigned=false'),
  });

  // Fetch all users for task assignment
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
  });

  // Task mutations
  const createTaskMutation = useMutation({
    mutationFn: async (data: any) => apiRequest('/api/team-tasks', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/team-tasks'] });
      setShowAssignTask(false);
      toast({ title: "Task assigned successfully" });
    },
    onError: () => {
      toast({ title: "Failed to assign task", variant: "destructive" });
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: async ({ taskId, data }: { taskId: string; data: any }) => 
      apiRequest(`/api/team-tasks/${taskId}/complete`, { method: 'PUT', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/team-tasks'] });
      setShowCompleteTask(false);
      setSelectedTask(null);
      toast({ title: "Task completed successfully" });
    },
    onError: () => {
      toast({ title: "Failed to complete task", variant: "destructive" });
    },
  });

  const handleAssignTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      assignedTo: formData.get('assignedTo') as string,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      priority: formData.get('priority') as string,
      dueDate: formData.get('dueDate') as string,
      requiresProof: formData.get('requiresProof') === 'true',
    };
    createTaskMutation.mutate(data);
  };

  const handleCompleteTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedTask) return;
    
    const formData = new FormData(e.currentTarget);
    const data = {
      notes: formData.get('notes') as string,
      proofFileUrl: (e.currentTarget as any).proofFileUrl || null,
    };
    completeTaskMutation.mutate({ taskId: selectedTask.id, data });
  };

  const handleFileUpload = async () => {
    try {
      const response = await apiRequest('/api/objects/upload', { method: 'POST' });
      return { method: 'PUT' as const, url: response.uploadURL };
    } catch (error) {
      toast({ title: "Failed to get upload URL", variant: "destructive" });
      throw error;
    }
  };

  const handleFileUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful[0]) {
      const fileUrl = result.successful[0].uploadURL;
      // Store the file URL in the form for submission
      const form = document.getElementById('complete-task-form') as HTMLFormElement;
      if (form) {
        (form as any).proofFileUrl = fileUrl;
      }
      toast({ title: "Proof file uploaded successfully" });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      pending: "outline",
      in_progress: "default",
      completed: "default",
      cancelled: "secondary",
    };
    
    const icons: Record<string, React.ReactNode> = {
      pending: <Clock className="w-3 h-3 mr-1" />,
      in_progress: <AlertTriangle className="w-3 h-3 mr-1" />,
      completed: <CheckCircle className="w-3 h-3 mr-1" />,
      cancelled: <Clock className="w-3 h-3 mr-1" />,
    };
    
    return (
      <Badge variant={variants[status] || "outline"} className="flex items-center">
        {icons[status]}
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      low: "secondary",
      medium: "outline",
      high: "default",
      urgent: "destructive",
    };
    return <Badge variant={variants[priority] || "outline"}>{priority}</Badge>;
  };

  const currentTasks = viewMode === 'assigned' ? assignedTasks : createdTasks;
  const isLoading = viewMode === 'assigned' ? assignedLoading : createdLoading;

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopHeader pageName="Team Management" />
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar />
      
        <div className="flex flex-col w-0 flex-1 overflow-hidden">
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="p-6 space-y-6" data-testid="page-team">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" data-testid="text-page-title">Team Management</h1>
          <p className="text-gray-600">Assign tasks and track team productivity with proof uploads</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'assigned' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('assigned')}
              data-testid="button-view-assigned"
            >
              Assigned to Me
            </Button>
            <Button
              variant={viewMode === 'created' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('created')}
              data-testid="button-view-created"
            >
              Created by Me
            </Button>
          </div>
          <Dialog open={showAssignTask} onOpenChange={setShowAssignTask}>
            <DialogTrigger asChild>
              <Button data-testid="button-assign-task">
                <Plus className="w-4 h-4 mr-2" />
                Assign Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign New Task</DialogTitle>
                <DialogDescription>
                  Create and assign a task to a team member
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAssignTask} className="space-y-4">
                <div>
                  <Label htmlFor="assignedTo">Assign To</Label>
                  <Select name="assignedTo" required>
                    <SelectTrigger data-testid="select-assignee">
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((member: User) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.firstName} {member.lastName} ({member.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="title">Task Title</Label>
                  <Input id="title" name="title" required data-testid="input-task-title" />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" data-testid="input-task-description" />
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select name="priority" defaultValue="medium">
                    <SelectTrigger data-testid="select-task-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input id="dueDate" name="dueDate" type="datetime-local" data-testid="input-task-due-date" />
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="requiresProof" 
                    name="requiresProof" 
                    value="true" 
                    defaultChecked 
                    data-testid="checkbox-requires-proof"
                  />
                  <Label htmlFor="requiresProof">Requires proof of completion</Label>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowAssignTask(false)} data-testid="button-cancel-task">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createTaskMutation.isPending} data-testid="button-save-task">
                    Assign Task
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Assigned to Me</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-assigned-tasks">{assignedTasks.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks I Created</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-created-tasks">{createdTasks.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-completed-tasks">
              {currentTasks.filter((task: TaskWithUsers) => task.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-tasks">
              {currentTasks.filter((task: TaskWithUsers) => task.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {viewMode === 'assigned' ? 'Tasks Assigned to Me' : 'Tasks I Created'}
          </CardTitle>
          <CardDescription>
            {viewMode === 'assigned' 
              ? 'Complete tasks and upload proof of completion' 
              : 'Monitor tasks assigned to your team members'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>{viewMode === 'assigned' ? 'Assigned By' : 'Assigned To'}</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Requires Proof</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentTasks.map((task: TaskWithUsers) => (
                <TableRow key={task.id} data-testid={`row-task-${task.id}`}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold" data-testid={`text-task-title-${task.id}`}>{task.title}</div>
                      {task.description && (
                        <div className="text-sm text-gray-500 mt-1" data-testid={`text-task-description-${task.id}`}>
                          {task.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell data-testid={`text-task-user-${task.id}`}>
                    {viewMode === 'assigned' 
                      ? `${task.assignedByUser?.firstName} ${task.assignedByUser?.lastName}`
                      : `${task.assignedToUser?.firstName} ${task.assignedToUser?.lastName}`
                    }
                  </TableCell>
                  <TableCell>
                    {getPriorityBadge(task.priority || 'medium')}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(task.status || 'pending')}
                  </TableCell>
                  <TableCell data-testid={`text-task-due-${task.id}`}>
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell data-testid={`text-task-proof-${task.id}`}>
                    {task.requiresProof ? "Yes" : "No"}
                  </TableCell>
                  <TableCell>
                    {viewMode === 'assigned' && task.status !== 'completed' && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedTask(task);
                          setShowCompleteTask(true);
                        }}
                        data-testid={`button-complete-task-${task.id}`}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Complete
                      </Button>
                    )}
                    {viewMode === 'created' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedTask(task)}
                        data-testid={`button-view-task-${task.id}`}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Complete Task Dialog */}
      <Dialog open={showCompleteTask} onOpenChange={setShowCompleteTask}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Task: {selectedTask?.title}</DialogTitle>
            <DialogDescription>
              {selectedTask?.requiresProof 
                ? "Upload proof of completion and add completion notes"
                : "Add completion notes for this task"
              }
            </DialogDescription>
          </DialogHeader>
          <form id="complete-task-form" onSubmit={handleCompleteTask} className="space-y-4">
            <div>
              <Label htmlFor="notes">Completion Notes</Label>
              <Textarea 
                id="notes" 
                name="notes" 
                placeholder="Describe how you completed this task..." 
                data-testid="input-completion-notes"
              />
            </div>
            {selectedTask?.requiresProof && (
              <div>
                <Label>Proof of Completion</Label>
                <p className="text-sm text-gray-600 mb-2">
                  Upload a file or photo that proves you completed this task
                </p>
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={10485760} // 10MB
                  onGetUploadParameters={handleFileUpload}
                  onComplete={handleFileUploadComplete}
                  buttonClassName="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Proof File
                </ObjectUploader>
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowCompleteTask(false)} data-testid="button-cancel-completion">
                Cancel
              </Button>
              <Button type="submit" disabled={completeTaskMutation.isPending} data-testid="button-submit-completion">
                Mark Complete
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
          </div>
        </main>
        </div>
      </div>
    </div>
  );
}