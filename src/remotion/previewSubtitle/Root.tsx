import { Composition } from 'remotion';
import { PreviewSubtitle } from './Composition';
import result from '../../test/mockup/videoResultStoryblocks.json';
import { subtitles } from '@/src/config/subtitles.config';

export const RemotionRoot = () => {
	return (
		<>
			<Composition
				id="previewSubtitle"
				component={PreviewSubtitle}
				durationInFrames={500}
				fps={60}
				width={1080}
				height={500}
				defaultProps={{
					data: result,
					subtitle: subtitles[0]
				}}
			/>
		</>
	);
};
