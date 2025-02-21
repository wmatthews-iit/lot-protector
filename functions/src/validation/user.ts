const nameMinLength = 3;
const nameMaxLength = 50;
const emailMaxLength = 100;

export default function isPersonValid({ name, email }:
  { name?: string, email: string }) {
  if (name != null) {
    if (typeof(name) !== 'string') return { success: false, message: 'Name must be a string' };
    if (name.length < nameMinLength) return { success: false, message: `Name must be at least ${nameMinLength} characters` };
    if (name.length > nameMaxLength) return { success: false, message: `Name must be at most ${nameMaxLength} characters` };
  }
  
  if (!email) return { success: false, message: 'Email required' };
  if (typeof(email) !== 'string') return { success: false, message: 'Email must be a string' };
  if (email.length > emailMaxLength) return { success: false, message: `Email must be at most ${emailMaxLength} characters` };
  
  return { success: true };
}
