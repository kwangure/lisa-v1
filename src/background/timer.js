import { readable } from './store';

const timer = readable(new Date(), set => {
	const interval = setInterval(() => {
		set(new Date());
	}, 1000);

	return () => clearInterval(interval);
});

export default timer