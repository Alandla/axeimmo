import { Audio } from 'remotion';
import { Voices } from './components/Audios';

export const VideoGenerate = ({ data }: { data: any }) => {
	if (!data || !data.video.sequences.length || data.video.sequences.length === 0) {
      return <div>Loading...</div>;
    }
	
	return (
		<>
			{ data.video.audio.url && <Audio src={data.video.audio.url} volume={data.video.audio.volume} /> }
			{ data.video.audio.voices && <Voices voices={data.video.audio.voices} volume={data.video.audio.volume} /> }
		</>
	);
};
