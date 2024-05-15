import React, { useReducer, useEffect } from "react";
import MonacoEditor from "react-monaco-editor";
import "./App.css";

function MonacoEditorComponent() {
	// Additional state to store the dynamic height of the first editor
	const [firstEditorHeight, setFirstEditorHeight] = useState("100%");

	const initialCode =
		"import bs4 as bs\nimport urllib.request\nimport re\nimport nltk\nimport requests\n#from gensim.summarization import summarize\nfrom bs4 import BeautifulSoup\n\n\nurl = 'https://www.npr.org/2019/07/10/740387601/university-of-texas-austin-promises-free-tuition-for-low-income-students-in-2020'\ndef getText(url):\n\tpage = requests.get(url).text\n\t\n\t# Turn page into BeautifulSoup object to access HTML tags\n\tsoup = BeautifulSoup(page, features=\"lxml\")\n\n\t# Get headline\n\theadline = soup.find('h1').get_text()\n\n\t# Get text from all <p> tags.\n\tp_tags = soup.find_all('p')\n\t# Get the text from each of the “p” tags and strip surrounding whitespace.\n\tp_tags_text = [tag.get_text().strip() for tag in p_tags]\n\n\t# Filter out sentences that contain newline characters '\\n' or don't contain periods.\n\tsentence_list = [sentence for sentence in p_tags_text if not '\\n' in sentence]\n\tsentence_list = [sentence for sentence in sentence_list if '.' in sentence]\n\t# Combine list items into string.\n\tarticle = ' '.join(sentence_list)\n\treturn article";

	const editorReducer = (state, action) => {
		switch (action.type) {
			case "TOGGLE_SPLIT_INDEX":
				return {
					...state,
					splitIndex:
						action.payload === state.splitIndex
							? null
							: action.payload,
					showCommentBox:
						action.payload === state.splitIndex ? false : true, // Toggle comment box visibility
				};
			case "TOGGLE_COMMENT_BOX":
				return {
					...state,
					showCommentBox: !state.showCommentBox,
				};
			default:
				return state;
		}
	};

	const initialState = {
		code: initialCode,
		splitIndex: null,
		showCommentBox: false, // Initial state for comment box visibility
	};

	const [state, dispatch] = useReducer(editorReducer, initialState);

	const editorDidMount = (editor, monaco, editorId) => {
		editor.focus();
		editor.onMouseDown((e) => {
			if (
				e.target.type ===
				monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS
			) {
				const { lineNumber } = e.target.position;
				dispatch({
					type: "TOGGLE_SPLIT_INDEX",
					payload:
						editorId === "second"
							? state.splitIndex + lineNumber
							: lineNumber - 1,
				});
			} else {
				dispatch({ type: "TOGGLE_COMMENT_BOX" }); // Hide comment box if clicking outside line numbers
			}
		});
	};

	const onChange = (newValue, e) => {
		dispatch({ type: "SET_CODE", payload: newValue });
	};

	const options = {
		selectOnLineNumbers: true,
		automaticLayout: true,
		minimap: {
			enabled: false,
		},
	};

	const splitCode = (code, index) => {
		const lines = code.split("\n");
		const beforeSplit = lines.slice(0, index + 1).join("\n");
		const afterSplit = lines.slice(index + 1).join("\n");
		return { beforeSplit, afterSplit, newLineNumber: index + 2 };
	};

	useEffect(() => {
		if (state.splitIndex !== null) {
			const lines = state.splitIndex + 1;
			const estimatedLineHeight = 20; // Adjust this based on your CSS
			console.log(
				lines,
				estimatedLineHeight,
				`${lines * estimatedLineHeight}px`
			);
			setFirstEditorHeight(`${lines * estimatedLineHeight}px`);
		} else {
			setFirstEditorHeight("100%");
		}
	}, [state.splitIndex, state.code]);

	const { beforeSplit, afterSplit } =
		state.splitIndex !== null
			? splitCode(state.code, state.splitIndex)
			: { beforeSplit: state.code, afterSplit: "" };

	return (
		<div className="editor-container">
			<MonacoEditor
				className="code-editor"
				width="800"
				height={firstEditorHeight}
				language="python"
				theme="vs-dark"
				value={beforeSplit}
				options={options}
				onChange={onChange}
				editorDidMount={(editor, monaco) =>
					editorDidMount(editor, monaco, "first")
				}
			/>
			{state.showCommentBox && (
				<div className="comment-box" style={{ margin: "20px 0" }}>
					<textarea
						placeholder="Leave a comment"
						style={{
							width: "100%",
							height: "100px",
							padding: "8px",
							boxSizing: "border-box",
						}}
					/>
					<div>
						<button
							onClick={() =>
								dispatch({ type: "TOGGLE_COMMENT_BOX" })
							}
						>
							Cancel
						</button>
						<button>Submit Comment</button>
					</div>
				</div>
			)}
			{state.splitIndex !== null && (
				<div className="editor-divider"></div>
			)}
			{state.splitIndex !== null && (
				<MonacoEditor
					className="code-editor"
					width="800"
					height="calc(50% - 2px)" // Adjust if necessary
					language="python"
					theme="vs-dark"
					value={afterSplit}
					options={{
						...options,
						firstLineNumber: state.splitIndex + 2,
						lineNumbers: (lineNumber) =>
							lineNumber + state.splitIndex + 1,
					}}
					onChange={onChange}
					editorDidMount={(editor, monaco) =>
						editorDidMount(editor, monaco, "second")
					}
				/>
			)}
		</div>
	);
}

export default MonacoEditorComponent;
