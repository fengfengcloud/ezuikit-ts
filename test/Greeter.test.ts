import { Gretter } from '../src/index';
test('My Greeter', () => {
  expect(Gretter('Carl')).toBe('Hello Carl');
});