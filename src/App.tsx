import React, { useEffect, useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import MonacoEditor from "react-monaco-editor";

function App() {
	const [content, setContent] = useState("");

	useEffect(() => {
		const fetchDocument = async () => {
			const response = await fetch(
				"https://revival-file-upload-bucket.s3.amazonaws.com/b724cc82-ba66-11ee-b269-faa9c0ada648.py?AWSAccessKeyId=AKIAQIMM7EL4N7YSO5SM&Signature=uszM43NgyBoLinaptvpBXsySY4E%3D&Expires=1706154214"
			);
			const text = await response.text();
			console.log(text);
			setContent(text);
		};

		fetchDocument();
	}, []);

	return (
		<div className="App">
			<MonacoEditor
				// width="800"
				// height="600"
				language="javascript"
				theme="vs-dark"
				value={content}
				options={{
					automaticLayout: true,
				}}
			/>
		</div>
	);
}

export default App;
