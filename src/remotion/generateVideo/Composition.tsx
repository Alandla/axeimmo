import { Audio } from 'remotion';
import { MediaBackground } from './components/background';
import { SubtitlesBold } from './subtitles/bold/subtitlesBold';
import { SubtitlesSimple } from './subtitles/simple/subtitlesSimple';

export const VideoGenerate = ({ data }: { data: any }) => {
	if (!data || !data.video.sequences.length || data.video.sequences.length === 0) {
        return <div>Loading...</div>;
    }

	return (
		<>
			<Audio src={data.video.audioUrl} />
			<MediaBackground sequences={data.video.sequences} />
			{ data.video.subtitle.style.template === 'bold' && <SubtitlesBold subtitleSequences={data.video.sequences} style={data.video.subtitle.style} /> }
			{ data.video.subtitle.style.template === 'simple' && <SubtitlesSimple subtitleSequences={data.video.sequences} style={data.video.subtitle.style} /> }
		</>
	);
};
