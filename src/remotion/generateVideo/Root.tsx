import { Composition } from 'remotion';
import { VideoGenerate } from './Composition';
import result from '../../test/mockup/videoResult.json';

const calculateMetadata = ({props}: {props: any}) => {
	console.log(props)
	const duration = props.data.video.metadata.audio_duration
	return {
	  durationInFrames: Math.ceil(duration * 60), // 60 est le fps
	  data: props.data.video.result,
	};
  };

export const RemotionRoot = () => {
	return (
		<>
			<Composition
				id="videoGenerate"
				component={VideoGenerate}
				durationInFrames={60}
				fps={60}
				width={1080}
				height={1920}
				defaultProps={{
					data: result,
					showWatermark: true
				}}
				calculateMetadata={calculateMetadata}
			/>
		</>
	);
};
