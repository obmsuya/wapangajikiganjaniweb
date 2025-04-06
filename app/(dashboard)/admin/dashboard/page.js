// app/(dashboard)/admin/dashboard/page.jsx
export default function AdminDashboard() {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card">
            <h3 className="text-lg font-medium mb-2">Total Users</h3>
            <p className="text-3xl font-bold">245</p>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-medium mb-2">Total Properties</h3>
            <p className="text-3xl font-bold">124</p>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-medium mb-2">Active Tenants</h3>
            <p className="text-3xl font-bold">312</p>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-medium mb-2">Revenue</h3>
            <p className="text-3xl font-bold">$12,450</p>
          </div>
        </div>
        
        <div className="card">
          <h3 className="text-xl font-medium mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {/* Activity items would go here */}
            <div className="flex items-center gap-4 pb-3 border-b border-card-border">
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center">
               
              </div>
              <div>
                <p className="font-medium">New User Registered</p>
                <p className="text-sm text-card-fg/70">John Doe registered as a landlord</p>
              </div>
              <div className="ml-auto text-sm text-card-fg/60">2 hours ago</div>
            </div>
          </div>
        </div>
      </div>
    );
  }