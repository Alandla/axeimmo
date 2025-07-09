import { Composition } from 'remotion';
import { VideoGenerate } from './Composition';
import { getVideoDimensions } from './utils/videoDimensions';
import result from '../../test/mockup/videoResult.json';

const calculateMetadata = ({props}: {props: any}) => {
	console.log(props)
	const duration = props.data.video.metadata.audio_duration
	const dimensions = getVideoDimensions(props.data.video.format || 'vertical');
	return {
	  durationInFrames: Math.ceil(duration * 60), // 60 est le fps
	  data: props.data.video.result,
	  width: dimensions.width,
	  height: dimensions.height,
	};
  };

export const RemotionRoot = () => {
	// Use default vertical format since the test file doesn't have format property
	const dimensions = getVideoDimensions('vertical');
	
	return (
		<>
			<Composition
				id="videoGenerate"
				component={VideoGenerate}
				durationInFrames={60}
				fps={60}
				width={dimensions.width}
				height={dimensions.height}
				defaultProps={{
					data: result,
					showWatermark: true,
					logo: undefined
				}}
				calculateMetadata={calculateMetadata}
			/>
		</>
	);
};
