# Git Workflow Guide - Main + Develop Strategy

## Branch Structure
```
main     ←── Production releases (stable, never broken)
develop  ←── Daily development work (integration branch)
```

## Daily Workflow

### 1. Work on develop branch
```bash
# Always work on develop
git checkout develop

# Make your changes (code, commit)
git add .
git commit -m "feat: add shipment module"
```

### 2. Push to develop
```bash
git push origin develop
```

### 3. Release to main (when ready for production)
```bash
# Switch to main
git checkout main

# Merge develop into main
git merge develop

# Push to main (production)
git push origin main

# Switch back to develop for more work
git checkout develop
```

## Emergency Scenarios

### 🚨 Something broke in main?
```bash
# Rollback to previous stable commit
git checkout main
git log --oneline -5  # Find the good commit hash
git revert <bad-commit-hash>  # Creates a revert commit
git push origin main
```

### 🚨 Want to abandon current work?
```bash
# Reset develop to main (lose current changes)
git checkout develop
git reset --hard main
git push --force-with-lease origin develop
```

### 🚨 Quick fix needed in production?
```bash
# Create hotfix from main
git checkout main
git checkout -b hotfix/urgent-bug-fix

# Fix the bug
git add .
git commit -m "hotfix: fix critical login issue"

# Merge to main immediately
git checkout main
git merge hotfix/urgent-bug-fix
git push origin main

# Also merge to develop so fix isn't lost
git checkout develop
git merge hotfix/urgent-bug-fix
git push origin develop

# Delete hotfix branch
git branch -d hotfix/urgent-bug-fix
```

## Best Practices

### ✅ DO:
- Always work on `develop` branch
- Commit frequently with clear messages
- Test before merging to `main`
- Use semantic commit messages:
  - `feat:` new features
  - `fix:` bug fixes
  - `docs:` documentation
  - `refactor:` code cleanup

### ❌ DON'T:
- Don't commit directly to `main` (except hotfixes)
- Don't push broken code to `main`
- Don't force push to `main` (only develop in emergencies)

## Current Status
- ✅ `main` = Production ready
- ✅ `develop` = Current work branch
- ✅ Remote branches configured

## Example Commands
```bash
# Check current branch
git branch

# Switch branches
git checkout develop
git checkout main

# See commit history
git log --oneline -10

# See differences
git diff main..develop
```

## When to Merge to Main
- ✅ Feature complete and tested
- ✅ Ready for deployment
- ✅ End of day/work session
- ✅ Before major changes

This workflow gives you safety net while keeping things simple for solo development!
