import { Composition } from 'remotion';
import { PreviewTransition } from './Composition';
import result from '../../test/mockup/videoResultTransition.json';
import { transitions } from './config/transitions.config';

export const RemotionRoot = () => {
	return (
		<>
			<Composition
				id="previewTransition"
				component={PreviewTransition}
				durationInFrames={100}
				fps={60}
				width={700}
				height={700}
				defaultProps={{
					data: result,
					transition: transitions[0]
				}}
			/>
		</>
	);
};
