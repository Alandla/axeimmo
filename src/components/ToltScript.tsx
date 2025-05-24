import React from 'react';
import Script from 'next/script';

export function ToltScript() {
  return (
    <Script
      src="https://cdn.tolt.io/tolt.js"
      data-tolt="pk_bTPskxyAUx72v7xvn8TVCg24"
      async
    />
  );
}

export default ToltScript; 