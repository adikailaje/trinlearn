import { DashboardData, SystemAlert, WorkItemStatus, Role, WorkItem, WorkRequest, User, EmployeeDashboardStats, ManagerDashboardStats, OwnerDashboardStats, WorkRequestStatus } from '../types';
import { myWorkService } from './myWorkService';
import { authService } from './authService';
import { rememberedMachinesService } from './rememberedMachinesService';

const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
};

export const dashboardService = {
  getDashboardData: async (currentUser: User | null): Promise<DashboardData> => {
    await simulateDelay(300);

    if (!currentUser) {
      throw new Error("User not authenticated.");
    }

    // --- Data Fetching ---
    const [allUsers, allMachinesAndOwnersRaw, userWorkItemsRaw, recentAlerts] = await Promise.all([
      authService.getAllUsersRaw(),
      rememberedMachinesService.getAllMachinesForAllUsers(),
      myWorkService.getWorkItemsForUser(currentUser.id),
      // Mock data for recent alerts - could be a real service call
      Promise.resolve<SystemAlert[]>([
        { id: 'alert-1', message: 'Equipment 789-B pressure critical. Investigate immediately.', type: 'equipment', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
        { id: 'alert-2', message: 'Safety harness inspection overdue for Zone C.', type: 'safety', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
        { id: 'alert-3', message: 'Routine maintenance on Conveyor Belt Alpha completed.', type: 'info', timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
        { id: 'alert-4', message: 'Unusual vibration detected on Pump P-102. Check ASAP.', type: 'equipment', timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString() },
      ])
    ]);
    const allMachinesAndOwners = allMachinesAndOwnersRaw || [];
    const userWorkItems = userWorkItemsRaw || [];
    const allWorkRequests = allMachinesAndOwners.flatMap(m => m.workRequests || []);

    // --- General Stats (for active work orders summary) ---
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    let dueTodayCount = 0;
    let overdueCount = 0;
    userWorkItems.forEach(item => {
      if (item.status !== WorkItemStatus.Completed) {
        const dueDate = new Date(item.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        if (dueDate < now) overdueCount++;
        else if (dueDate.getTime() === now.getTime()) dueTodayCount++;
      }
    });

    const dashboardData: DashboardData = {
      activeWorkOrdersSummary: { dueToday: dueTodayCount, overdue: overdueCount },
      recentAlerts: recentAlerts.slice(0, 3),
      roleSpecificData: undefined,
    };
    
    // --- Role-Specific Logic ---
    const todayDate = new Date();

    if (currentUser.role === Role.User) {
        const workItemsCompletedToday = userWorkItems.filter(item => item.completionTime && isToday(new Date(item.completionTime)) && item.status === WorkItemStatus.Completed);

        // Find team reports
        let teamReports: WorkRequest[] = [];
        if (currentUser.managerId) {
            const teamMemberIds = allUsers.filter(u => u.managerId === currentUser.managerId).map(u => u.id);
            teamReports = allWorkRequests.filter(wr => wr.createdByUserId && teamMemberIds.includes(wr.createdByUserId) && wr.status === WorkRequestStatus.Open);
        } else {
            // User has no manager, just show their own reports
            teamReports = allWorkRequests.filter(wr => wr.createdByUserId === currentUser.id && wr.status === WorkRequestStatus.Open);
        }

        const stats: EmployeeDashboardStats = {
            tasksDueToday: dueTodayCount,
            tasksCompletedToday: workItemsCompletedToday.length,
            workItemsDueToday: userWorkItems.filter(item => isToday(new Date(item.dueDate)) && item.status !== WorkItemStatus.Completed),
            workItemsCompletedToday,
            teamReports: teamReports.sort((a,b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()),
        };
        dashboardData.roleSpecificData = { role: Role.User, stats };

    } else if (currentUser.role === Role.Manager) {
        const managedUserIds = allUsers.filter(u => u.managerId === currentUser.id).map(u => u.id);
        const newWorkRequests = allWorkRequests.filter(wr => wr.createdByUserId && managedUserIds.includes(wr.createdByUserId) && wr.status === WorkRequestStatus.Open);
        
        let employeeTasksCompletedTodayCount = 0;
        let employeeOpenTasksCount = 0;
        const employeeOpenTasksByPriority = { High: 0, Medium: 0, Low: 0 };
        const employeePerformance: Array<{ id: string, username: string; profilePictureUrl?: string; completedCount: number }> = [];

        for (const empId of managedUserIds) {
            const empWorkItems = (await myWorkService.getWorkItemsForUser(empId)) || [];
            let completedTodayForEmp = 0;
            empWorkItems.forEach(item => {
                if (item.status !== WorkItemStatus.Completed) {
                    employeeOpenTasksCount++;
                    employeeOpenTasksByPriority[item.priority]++;
                }
                if (item.completionTime && isToday(new Date(item.completionTime)) && item.status === WorkItemStatus.Completed) {
                    employeeTasksCompletedTodayCount++;
                    completedTodayForEmp++;
                }
            });
            if (completedTodayForEmp > 0) {
                const emp = allUsers.find(u => u.id === empId);
                if(emp) employeePerformance.push({ id: emp.id, username: emp.username, profilePictureUrl: localStorage.getItem(`user_pfp_${emp.id}`) || undefined, completedCount: completedTodayForEmp });
            }
        }
        
        const stats: ManagerDashboardStats = {
            employeeTasksCompletedTodayCount,
            employeeOpenTasksCount,
            employeeOpenTasksByPriority,
            topPerformingEmployees: employeePerformance.sort((a,b) => b.completedCount - a.completedCount).slice(0, 5),
            newWorkRequests: newWorkRequests.sort((a,b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()),
        };
        dashboardData.roleSpecificData = { role: Role.Manager, stats };

    } else if (currentUser.role === Role.Admin || currentUser.role === Role.SuperAdmin) {
        const allOpenWorkRequests = allWorkRequests.filter(wr => wr.status === WorkRequestStatus.Open);
        
        let orgTasksCompletedTodayCount = 0;
        let orgOpenTasksCount = 0;
        let orgOpenHighPriorityTasksCount = 0;
        const tasksCompletedByRole = { employee: 0, manager: 0 };
        
        for (const user of allUsers) {
            if (user.role === Role.SuperAdmin && user.id !== currentUser.id) continue;
            const userItems = (await myWorkService.getWorkItemsForUser(user.id)) || [];
            userItems.forEach(item => {
                if (item.status !== WorkItemStatus.Completed) {
                    orgOpenTasksCount++;
                    if (item.priority === 'High') orgOpenHighPriorityTasksCount++;
                }
                if (item.completionTime && isToday(new Date(item.completionTime)) && item.status === WorkItemStatus.Completed) {
                    orgTasksCompletedTodayCount++;
                    if (user.role === Role.User) tasksCompletedByRole.employee++;
                    else if (user.role === Role.Manager) tasksCompletedByRole.manager++;
                }
            });
        }
        
        const stats: OwnerDashboardStats = {
            orgTasksCompletedTodayCount,
            orgOpenTasksCount,
            orgOpenHighPriorityTasksCount,
            tasksCompletedByRole,
            allOpenWorkRequests: allOpenWorkRequests.sort((a,b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()),
        };
        dashboardData.roleSpecificData = { role: currentUser.role, stats };
    }
    
    return dashboardData;
  },
};
