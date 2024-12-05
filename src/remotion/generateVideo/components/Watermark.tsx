
import { AbsoluteFill, Img, staticFile } from "remotion";

export const Watermark = () => {
 
	return (
		<AbsoluteFill>
			<Img
				src={"https://media.hoox.video/hoox-watermark.png"}
				style={{
                    position: 'absolute', // Positions the image absolutely
                    top: '300px', // Adds a 10px margin from the top
                    left: '20px', // Adds a 10px margin from the left
                    width: '26%', // Reduces the size to 50% of the original
                    height: 'auto', // Keeps the aspect ratio
                    opacity: 0.7, // Adds transparency
					zIndex: 1000,
                }}
			/>
		</AbsoluteFill>
	);
};