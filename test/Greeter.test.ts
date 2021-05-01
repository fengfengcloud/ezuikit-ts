//
const exec = (name: string) => {
  return `Hello ${name}`
}

test('test exec', () => {
  expect(exec('Vienna')).toBe('Hello Vienna');
})