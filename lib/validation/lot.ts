const name = { minLength: 3, maxLength: 100 };
const zone = { minLength: 3, maxLength: 50 };
const timeToAlert = { min: 1 };

export default {
  name: (value: string) => (value.length >= name.minLength ? null : `At least ${name.minLength} characters`)
    || (value.length <= name.maxLength ? null : `At most ${name.maxLength} characters`),
  timeToAlert: (value: string) => (value ? null : 'Required')
    || (Number(value) >= timeToAlert.min ? null : `At least ${timeToAlert.min} minutes`),
  zone: { name: (value: string) => (value.length >= zone.minLength ? null : `At least ${zone.minLength} characters`)
  || (value.length <= zone.maxLength ? null : `At most ${zone.maxLength} characters`) },
};
