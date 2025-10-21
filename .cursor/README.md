# Cursor Workspace Configuration
**Cubic Matrix Level 5 - Persistent Dev Profile**

## 🧠 What This Does
This workspace is configured to automatically apply the **Cubic Matrix Dev Mode Level 5** reasoning framework to all Cursor interactions.

## 📁 Files Overview
- **`startup.md`** - Auto-loads Dev Profile and applies Level 5 reasoning
- **`rules.md`** - Workspace-specific rules and quality standards  
- **`bootstrap-prompt.md`** - One-time setup prompt for new sessions
- **`README.md`** - This documentation file

## 🚀 Quick Start
1. **First Time**: Run the bootstrap prompt from `.cursor/bootstrap-prompt.md`
2. **Every Session**: Cursor automatically loads Level 5 reasoning
3. **Manual Override**: Use `@cursor Disable Level 5` if needed

## 🎯 Expected Behavior
Cursor will automatically:
- Structure responses as: ARCHITECTURE → PLAN → CODE → TEST → HANDOFF → CURSOR PROMPT
- Include 5-dimension quality rubrics
- Apply TypeScript + React + Next.js 14 standards
- Favor correctness over speed
- Provide complete, runnable code with explicit filenames

## 🔧 Customization
To modify the Dev Profile behavior:
1. Edit `docs/Dev_Profile_and_Cursor_Prompt_Pack.md`
2. Update `.cursor/startup.md` if needed
3. Restart Cursor to reload changes

## 📋 Quality Standards
- **Clarity**: Modular + diagram-ready
- **Accuracy**: Verified against docs/specs  
- **Maintainability**: Lint-safe, reusable
- **Scalability**: Distributed, future-proof
- **Security**: Threat-modeled, secure-by-design

---
**This configuration ensures consistent, high-quality development practices across all Cursor sessions.**
