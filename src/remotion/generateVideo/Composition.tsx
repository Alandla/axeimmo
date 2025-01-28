import { Audio } from 'remotion';
import { MediaBackground } from './components/background';
import { SubtitlesBold } from './subtitles/bold/subtitlesBold';
import { SubtitlesSimple } from './subtitles/simple/subtitlesSimple';
import { SubtitlesBackground } from './subtitles/background/subtitlesBackground';
import { SubtitlesClean } from './subtitles/clean/subtitlesClean';
import { BackgroundWithAvatar } from './components/backgroundWithAvatar';
import { Watermark } from './components/Watermark';
import { SubtitlesDaniel } from './subtitles/daniel/subtitlesDaniel';
import { SubtitlesModern } from './subtitles/modern/subtitlesModern';
import { Voices } from './components/Audios';

export const VideoGenerate = ({ data, showWatermark = true }: { data: any, showWatermark?: boolean }) => {
	if (!data || !data.video.sequences.length || data.video.sequences.length === 0) {
      return <div>Loading...</div>;
    }

	const videoSequences = data.video.sequences.filter((sequence: any) => sequence.type !== 'transition');
	const transitionSequences = data.video.sequences.filter((sequence: any) => sequence.type === 'transition');
	
	return (
		<>
			{ data.video.audio.url && <Audio src={data.video.audio.url} volume={data.video.audio.volume} /> }
			{ data.video.audio.voices && <Voices voices={data.video.audio.voices} volume={data.video.audio.volume} /> }
			{ data.video.audio.music && <Audio src={data.video.audio.music.url} volume={data.video.audio.music.volume} /> }
			{showWatermark && <Watermark />}
			{ data.video.avatar ? <BackgroundWithAvatar sequences={videoSequences} avatar={data.video.avatar} duration={data.video.metadata.audio_duration} /> : <MediaBackground sequences={videoSequences} /> }
			{ data.video.subtitle.style.template === 'bold' && <SubtitlesBold subtitleSequences={videoSequences} style={data.video.subtitle.style} /> }
			{ data.video.subtitle.style.template === 'simple' && <SubtitlesSimple subtitleSequences={videoSequences} style={data.video.subtitle.style} /> }
			{ data.video.subtitle.style.template === 'background' && <SubtitlesBackground subtitleSequences={videoSequences} style={data.video.subtitle.style} /> }
			{ data.video.subtitle.style.template === 'clean' && <SubtitlesClean subtitleSequences={videoSequences} style={data.video.subtitle.style} /> }
			{ data.video.subtitle.style.template === 'daniel' && <SubtitlesDaniel subtitleSequences={videoSequences} style={data.video.subtitle.style} /> }
			{ data.video.subtitle.style.template === 'modern' && <SubtitlesModern subtitleSequences={videoSequences} style={data.video.subtitle.style} /> }
		</>
	);
};
