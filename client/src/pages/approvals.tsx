import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Clock, Users, FileText, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: string;
  title: string;
  description: string;
  status: "pending_approval" | "approved" | "rejected" | "in_progress";
  assignedUser: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  proofFileUrl?: string;
  submittedAt: string;
  comments?: string;
}

interface TeamData {
  currentUser: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    hierarchyLevel: number;
    canApprove: boolean;
  };
  subordinates: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    hierarchyLevel: number;
    canApprove: boolean;
    reportsTo?: string;
  }>;
  approvers: Array<{
    id: string;
    firstName: string;
    lastName: string;
    canApprove: boolean;
  }>;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "proof_submitted" | "task_approved" | "task_rejected";
  taskId: string;
  isRead: boolean;
  createdAt: string;
}

export default function ApprovalsPage() {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [rejectionComments, setRejectionComments] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get team information
  const { data: teamData } = useQuery<TeamData>({
    queryKey: ["/api/team/members"],
    retry: false,
  });

  // Get pending approvals
  const { data: pendingTasks = [], isLoading: loadingTasks } = useQuery<Task[]>({
    queryKey: ["/api/tasks/pending-approval"],
    retry: false,
  });

  // Get notifications
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    retry: false,
  });

  // Task approval mutation
  const approveMutation = useMutation({
    mutationFn: async ({ taskId, action, comments }: { taskId: string; action: "approve" | "reject"; comments?: string }) => {
      return apiRequest(`/api/tasks/${taskId}/approve`, "PUT", { action, comments });
    },
    onSuccess: (_, { action }) => {
      toast({
        title: "Success",
        description: `Task ${action}d successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/pending-approval"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      setSelectedTaskId(null);
      setRejectionComments("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleApprove = (taskId: string) => {
    approveMutation.mutate({ taskId, action: "approve" });
  };

  const handleReject = (taskId: string) => {
    if (!rejectionComments.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }
    approveMutation.mutate({ 
      taskId, 
      action: "reject", 
      comments: rejectionComments 
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_approval":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const canUserApprove = teamData?.currentUser?.canApprove;

  if (!canUserApprove) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
              <p className="text-gray-600">You don't have permission to view approvals.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="approvals-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Approvals</h1>
          <p className="text-gray-600">Review and approve team member task submissions</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-gray-600">Hierarchy Level</p>
            <p className="font-semibold text-blue-600">{teamData?.currentUser?.hierarchyLevel || "N/A"}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{pendingTasks.length}</p>
                <p className="text-sm text-gray-600">Pending Approvals</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{teamData?.subordinates?.length || 0}</p>
                <p className="text-sm text-gray-600">Team Members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{notifications.filter(n => !n.isRead).length}</p>
                <p className="text-sm text-gray-600">Unread Notifications</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending" data-testid="tab-pending">Pending Approvals</TabsTrigger>
          <TabsTrigger value="team" data-testid="tab-team">Team Overview</TabsTrigger>
          <TabsTrigger value="notifications" data-testid="tab-notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {loadingTasks ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading pending approvals...</p>
            </div>
          ) : pendingTasks.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">All Caught Up!</h3>
                  <p className="text-gray-600">No pending approvals at this time.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingTasks.map((task: Task) => (
                <Card key={task.id} className="border-l-4 border-l-yellow-400">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{task.title}</CardTitle>
                        <CardDescription className="mt-1">
                          Submitted by {task.assignedUser.firstName} {task.assignedUser.lastName}
                        </CardDescription>
                      </div>
                      {getStatusBadge(task.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-700">{task.description}</p>
                    
                    {task.proofFileUrl && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 mb-2">Submitted Proof:</p>
                        <a 
                          href={task.proofFileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                          data-testid={`proof-link-${task.id}`}
                        >
                          View Proof File
                        </a>
                      </div>
                    )}

                    <div className="text-sm text-gray-500">
                      Submitted: {new Date(task.submittedAt).toLocaleDateString()} at {new Date(task.submittedAt).toLocaleTimeString()}
                    </div>

                    <div className="flex space-x-3">
                      <Button
                        onClick={() => handleApprove(task.id)}
                        disabled={approveMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                        data-testid={`approve-task-${task.id}`}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleReject(task.id)}
                        disabled={approveMutation.isPending}
                        variant="destructive"
                        data-testid={`reject-task-${task.id}`}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Hierarchy</CardTitle>
              <CardDescription>Overview of your team structure and approval permissions</CardDescription>
            </CardHeader>
            <CardContent>
              {teamData?.subordinates && teamData.subordinates.length > 0 ? (
                <div className="space-y-3">
                  {teamData.subordinates.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{member.firstName} {member.lastName}</p>
                        <p className="text-sm text-gray-600">{member.email}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={member.canApprove ? "default" : "secondary"}>
                          Level {member.hierarchyLevel}
                        </Badge>
                        {member.canApprove && (
                          <p className="text-xs text-green-600 mt-1">Can Approve</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">No team members reporting to you.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
              <CardDescription>Stay updated on team activity and approvals</CardDescription>
            </CardHeader>
            <CardContent>
              {notifications.length > 0 ? (
                <div className="space-y-3">
                  {notifications.map((notification: Notification) => (
                    <div 
                      key={notification.id} 
                      className={`p-3 border rounded-lg ${notification.isRead ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{notification.title}</p>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={notification.type === "proof_submitted" ? "secondary" : 
                                        notification.type === "task_approved" ? "default" : "destructive"}>
                            {notification.type.replace("_", " ")}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(notification.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">No notifications yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}