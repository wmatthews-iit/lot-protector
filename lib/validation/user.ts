const name = { minLength: 3, maxLength: 100 };
const email = { maxLength: 100 };

export default {
  name: (value: string) => (value.length >= name.minLength ? null : `At least ${name.minLength} characters`)
    || (value.length <= name.maxLength ? null : `At most ${name.maxLength} characters`),
  email: (value: string) => (value.length ? null : 'Required')
    || (value.length <= email.maxLength ? null : `At most ${email.maxLength} characters`)
    || (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
};
