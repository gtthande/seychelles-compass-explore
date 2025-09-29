# Dev Sync Panel Setup Guide

## Overview
The Dev Sync Panel provides a web-based interface for managing code synchronization and database migrations directly from the admin dashboard.

## Prerequisites
- Node.js 18+ installed
- Git repository with remote origin
- Admin role in the application
- Supabase CLI (for database migrations)

## Installation

### 1. Install Dependencies
```bash
npm install express cors concurrently
```

### 2. Environment Configuration
Add to your `.env` file:
```bash
ALLOW_SYNC=1
SYNC_SERVER_PORT=3001
```

### 3. Start Development Environment

#### Option A: Start Both Servers
```bash
npm run dev:full
```
This starts both the frontend (port 5173) and sync server (port 3001).

#### Option B: Start Individually
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Sync Server
npm run dev:sync
```

## Usage

### Accessing the Dev Sync Panel
1. Navigate to `http://localhost:5173/admin`
2. Ensure you have admin role (`role = 'admin'`)
3. Click on the "Dev Sync" tab
4. If sync is not available, check that `ALLOW_SYNC=1` is set

### Available Operations

#### 1. Pull from GitHub (Blue Button)
- Fetches latest changes from `origin/main`
- Updates your local repository
- Safe operation - no data loss

#### 2. Push to GitHub (Green Button)
- Stages all changes with `git add .`
- Commits with message "Dev Sync: [action]"
- Pushes to `origin/main`
- **Requires write access to repository**

#### 3. Sync UI (Black Button)
- Placeholder for UI component synchronization
- Currently shows success message
- Can be extended for specific workflows

#### 4. Push DB Migrations (Purple Button)
- Runs `npx supabase migration push`
- Pushes pending migrations to production database
- **Requires Supabase CLI and proper authentication**

## Security Features

### Role-based Access
- Only users with `role = 'admin'` can access the panel
- Regular users and business users cannot see the Dev Sync tab

### Environment Gating
- Panel only appears when `ALLOW_SYNC=1` is set
- Graceful degradation when sync is not available
- Clear messaging about setup requirements

### Server Validation
- Health check endpoint validates sync server availability
- Network errors are handled gracefully
- Real-time feedback on operation status

## Troubleshooting

### Sync Panel Not Visible
1. Check that you have admin role
2. Verify `ALLOW_SYNC=1` in `.env`
3. Ensure sync server is running on port 3001
4. Check browser console for errors

### Sync Server Won't Start
1. Check if port 3001 is available
2. Verify all dependencies are installed
3. Check for Node.js version compatibility
4. Review server logs for specific errors

### Git Operations Fail
1. Ensure you have git repository initialized
2. Check that remote origin is configured
3. Verify you have write access to repository
4. Check git credentials are configured

### Database Migrations Fail
1. Install Supabase CLI: `npm install -g supabase`
2. Authenticate with Supabase: `supabase login`
3. Link your project: `supabase link`
4. Verify migrations exist in `supabase/migrations/`

## Development

### Extending Sync Operations
To add new sync operations:

1. Add endpoint to `scripts/sync-server.js`:
```javascript
app.post('/api/sync/your-operation', async (req, res) => {
  // Your sync logic here
});
```

2. Add button to `src/pages/admin/DevSyncPanel.tsx`:
```typescript
const handleYourOperation = () => executeSync('Your Operation', 'your-operation');
```

3. Update documentation with new operation details

### Customizing Commit Messages
Modify the commit message format in `scripts/sync-server.js`:
```javascript
const commitMessage = req.body.message || 'Dev Sync: UI Sync';
```

### Adding Authentication
For production use, consider adding:
- API key authentication
- Rate limiting
- Request logging
- Audit trails

## Production Considerations

### Security
- Never commit `.env` files with `ALLOW_SYNC=1`
- Use environment-specific configuration
- Implement proper authentication
- Add rate limiting and monitoring

### Monitoring
- Log all sync operations
- Monitor for failed operations
- Set up alerts for critical failures
- Track usage patterns

### Backup
- Ensure git repository is backed up
- Database migrations should be version controlled
- Test sync operations in staging environment
- Have rollback procedures ready

## Support

### Common Issues
- **Port conflicts**: Change `SYNC_SERVER_PORT` in `.env`
- **Permission errors**: Check git credentials and repository access
- **Network errors**: Verify sync server is running and accessible
- **Database errors**: Check Supabase CLI installation and authentication

### Getting Help
1. Check the logs panel for detailed error messages
2. Review server console output for technical details
3. Verify all prerequisites are met
4. Test individual components separately

---

*Last updated: January 19, 2025*
