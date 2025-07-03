import React, { useState } from 'react';
import { User, Role } from '../types';
import { UserCircleIcon, UserGroupIcon, SitemapIcon, UserPlusIcon, ChevronDownIcon } from './Icons';

interface UserHierarchyProps {
  users: User[];
  currentUser: User | null;
  onAddWorker: (managerId: string) => void;
  onAssignManager: (employeeId: string, managerId: string | null) => void;
}

const UserCard: React.FC<{ user: User; children?: React.ReactNode; className?: string }> = ({ user, children, className }) => (
  <div className={`flex flex-col items-center p-2 bg-neutral-800/50 border border-neutral-700 rounded-lg w-32 text-center flex-shrink-0 ${className}`}>
    {user.profilePictureUrl ? (
      <img src={user.profilePictureUrl} alt={user.username} className="w-10 h-10 rounded-full object-cover mb-1 border-2 border-neutral-600"/>
    ) : (
      <UserCircleIcon className="w-10 h-10 text-neutral-500 mb-1"/>
    )}
    <p className="text-xs font-medium text-neutral-200 truncate w-full" title={user.username}>{user.username}</p>
    <p className="text-[10px] text-neutral-400 capitalize">{user.role}</p>
    {children}
  </div>
);

const UserHierarchy: React.FC<UserHierarchyProps> = ({ users, currentUser, onAddWorker, onAssignManager }) => {
  const [selectedManagerId, setSelectedManagerId] = useState<string | null>(null);

  if (!currentUser) return null;

  const isSuperAdmin = currentUser.role === Role.SuperAdmin;

  const superAdmins = users.filter(u => u.role === Role.SuperAdmin).sort((a,b) => a.username.localeCompare(b.username));
  const admins = users.filter(u => u.role === Role.Admin).sort((a,b) => a.username.localeCompare(b.username));
  const managers = users.filter(u => u.role === Role.Manager).sort((a,b) => a.username.localeCompare(b.username));
  const employees = users.filter(u => u.role === Role.User).sort((a,b) => a.username.localeCompare(b.username));

  const employeesByManager = employees.reduce((acc, emp) => {
    const managerId = emp.managerId || 'unassigned';
    if (!acc[managerId]) acc[managerId] = [];
    acc[managerId].push(emp);
    return acc;
  }, {} as Record<string, User[]>);

  const unassignedEmployees = employeesByManager['unassigned'] || [];

  return (
    <div className="space-y-6">
      {/* Top Level Roles */}
      {superAdmins.length > 0 && <RoleLevel title="Super Admins" users={superAdmins} icon={SitemapIcon} />}
      {admins.length > 0 && <RoleLevel title="Owners / Admins" users={admins} icon={UserGroupIcon} />}
      
      {/* Manager Teams */}
      {managers.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-center text-sm font-semibold text-neutral-400 mb-2 border-t border-b border-neutral-700 py-2">
            <UserGroupIcon className="w-4 h-4 mr-2" /> Teams
          </div>
          {managers.map(manager => {
            const isSelected = selectedManagerId === manager.id;
            const team = employeesByManager[manager.id] || [];
            return (
              <div key={manager.id} className="flex flex-col items-center">
                {/* Manager Card */}
                <div 
                  className={`relative p-1 rounded-lg transition-colors ${isSelected ? 'bg-red-900/50' : ''}`}
                  onClick={isSuperAdmin ? () => setSelectedManagerId(isSelected ? null : manager.id) : undefined}
                >
                  <UserCard user={manager} className={isSuperAdmin ? 'cursor-pointer' : ''} />
                   {isSuperAdmin && isSelected && (
                     <button
                        onClick={(e) => { e.stopPropagation(); onAddWorker(manager.id); }}
                        className="absolute -top-2 -right-2 flex items-center p-1.5 rounded-full bg-green-600 hover:bg-green-500 text-white shadow-lg transition-transform hover:scale-110"
                        title="Add Worker to this team"
                      >
                       <UserPlusIcon className="w-4 h-4" />
                     </button>
                   )}
                </div>
                
                {/* Connector and Employee List */}
                {team.length > 0 && (
                    <>
                        <div className="h-4 w-px bg-neutral-600"></div>
                        <div className="flex flex-wrap justify-center gap-3">
                            {team.map(employee => (
                                <UserCard key={employee.id} user={employee}>
                                {isSuperAdmin && (
                                    <div className="mt-1.5 w-full relative">
                                        <select
                                            value={employee.managerId || 'unassigned'}
                                            onChange={(e) => onAssignManager(employee.id, e.target.value === 'unassigned' ? null : e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="w-full text-[10px] bg-neutral-700 border border-neutral-600 rounded p-0.5 appearance-none text-center"
                                        >
                                            <option value="unassigned">Unassigned</option>
                                            <optgroup label="Managers">
                                                {managers.map(m => <option key={m.id} value={m.id}>{m.username}</option>)}
                                            </optgroup>
                                        </select>
                                        <ChevronDownIcon className="w-3 h-3 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400"/>
                                    </div>
                                )}
                                </UserCard>
                            ))}
                        </div>
                    </>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      {/* Unassigned Employees */}
      {unassignedEmployees.length > 0 && (
         <div className="space-y-4 border-t border-neutral-700 pt-4">
             <h4 className="text-center text-sm font-semibold text-neutral-400">Unassigned Employees</h4>
             <div className="flex flex-wrap justify-center gap-3">
                 {unassignedEmployees.map(employee => (
                    <UserCard key={employee.id} user={employee}>
                        {isSuperAdmin && (
                            <div className="mt-1.5 w-full relative">
                                <select
                                    value="unassigned"
                                    onChange={(e) => onAssignManager(employee.id, e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full text-[10px] bg-neutral-700 border border-neutral-600 rounded p-0.5 appearance-none text-center"
                                >
                                    <option value="unassigned">Unassigned</option>
                                    <optgroup label="Assign to Manager">
                                        {managers.map(m => <option key={m.id} value={m.id}>{m.username}</option>)}
                                    </optgroup>
                                </select>
                                <ChevronDownIcon className="w-3 h-3 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400"/>
                            </div>
                        )}
                    </UserCard>
                 ))}
             </div>
         </div>
      )}
    </div>
  );
};

const RoleLevel: React.FC<{ title: string; users: User[]; icon: React.ElementType }> = ({ title, users, icon: Icon }) => (
  <div className="w-full">
    <div className="flex items-center justify-center text-sm font-semibold text-neutral-400 mb-2">
      <Icon className="w-4 h-4 mr-2" /> {title}
    </div>
    <div className="flex flex-wrap justify-center gap-3">
      {users.map(user => <UserCard key={user.id} user={user} />)}
    </div>
  </div>
);

export default UserHierarchy;
