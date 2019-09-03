import foo from '.'

describe('node-starter', () => {
	describe('foo', () => {
		it('returns "bar"', () => {
			expect(foo()).toBe('bar')
		})
	})
})
