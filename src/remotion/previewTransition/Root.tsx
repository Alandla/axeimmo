import { Composition } from 'remotion';
import { PreviewTransition } from './Composition';
import result from '../../test/mockup/videoResultTransition.json';
import { transitions } from './config/transitions.config';

const calculateMetadata = ({props}: {props: any}) => {
	const duration = props.transition.durationInFrames + 30 + (props.transition.fullAt || 0);
	return {
	  durationInFrames: duration,
	};
  };

export const RemotionRoot = () => {
	return (
		<>
			<Composition
				id="previewTransition"
				component={PreviewTransition}
				durationInFrames={500}
				fps={60}
				width={700}
				height={700}
				defaultProps={{
					data: result,
					transition: transitions[0]
				}}
				calculateMetadata={calculateMetadata}
			/>
		</>
	);
};
