sed -i 's/{elapsedTime > 0 && !isRecording && (/{elapsedTime > 0 && !isRecording && (\n          <>/' src/components/RunRecorder.tsx
sed -i 's/} : <Save className=\"w-6 h-6\" \/>}/} : <Save className=\"w-6 h-6\" \/>}\n           <\/button>\n          <\/>/' src/components/RunRecorder.tsx
