import { Audio } from 'remotion';
import { MediaBackground } from './components/background';
import { SubtitlesSimple } from './subtitles/simple/subtitlesSimple';

export const VideoGenerate = ({ data }: { data: any }) => {
	if (!data || !data.video.sequences.length || data.video.sequences.length === 0) {
        return <div>Loading...</div>;
    }

	return (
		<>
			<Audio src={data.video.audioUrl} />
			<MediaBackground sequences={data.video.sequences} />
			<SubtitlesSimple subtitleSequences={data.video.sequences} />
		</>
	);
};
