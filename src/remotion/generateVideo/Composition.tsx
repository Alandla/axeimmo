import { Audio } from 'remotion';
import { MediaBackground } from './components/background';
import { SubtitlesBold } from './subtitles/bold/subtitlesBold';
import { SubtitlesSimple } from './subtitles/simple/subtitlesSimple';
import { SubtitlesBackground } from './subtitles/background/subtitlesBackground';
import { SubtitlesClean } from './subtitles/clean/subtitlesClean';
import { BackgroundWithAvatar } from './components/backgroundWithAvatar';
import { Watermark } from './components/Watermark';

export const VideoGenerate = ({ data }: { data: any }) => {
	if (!data || !data.video.sequences.length || data.video.sequences.length === 0) {
        return <div>Loading...</div>;
    }
	return (
		<>
			<Audio src={data.video.audioUrl} />
			<Watermark />
			{ data.video.avatar ? <BackgroundWithAvatar sequences={data.video.sequences} avatar={data.video.avatar} duration={data.video.metadata.audio_duration} /> : <MediaBackground sequences={data.video.sequences} /> }
			{ data.video.subtitle.style.template === 'bold' && <SubtitlesBold subtitleSequences={data.video.sequences} style={data.video.subtitle.style} /> }
			{ data.video.subtitle.style.template === 'simple' && <SubtitlesSimple subtitleSequences={data.video.sequences} style={data.video.subtitle.style} /> }
			{ data.video.subtitle.style.template === 'background' && <SubtitlesBackground subtitleSequences={data.video.sequences} style={data.video.subtitle.style} /> }
			{ data.video.subtitle.style.template === 'clean' && <SubtitlesClean subtitleSequences={data.video.sequences} style={data.video.subtitle.style} /> }
		</>
	);
};
