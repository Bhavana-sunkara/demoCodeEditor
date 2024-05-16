import React, { useReducer, useEffect, useState } from "react";
import MonacoEditor, { monaco } from "react-monaco-editor";
import "./App.css";
import axios from "axios";

function MonacoEditorComponent() {
	// TODO: Remove highlight when clicking on the same line(s)
	//      - Currently the highlight works when selecting multiple lines and single lines
	// TODO: Remove highlight when canceling comment
	// TODO: add CSS for comment box
	// TODO: Make total height of the editor fixed
	// TODO: Fetch the presigned url
	// Add the props etc
	// TODO: make apply changes box to submit the changes

	const [firstEditorHeight, setFirstEditorHeight] = useState("100%");
	const [secondEditorHeight, setSecondEditorHeight] = useState("0%");
	const [modRequest, setModRequest] = useState("");
	const [accessToken, setAccessToken] = useState("");
	const [firstEditor, setFirstEditor] = useState(null);
	const [secondEditor, setSecondEditor] = useState(null);

	const [monacoRef, setMonacoRef] = useState(null);

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
					content:
						action.payload === state.splitIndex
							? []
							: state.content,
				};
			case "TOGGLE_COMMENT_BOX":
				return {
					...state,
					showCommentBox: !state.showCommentBox,
					splitIndex: null,
					content: [],
				};
			case "CODE_MODIFIED":
				return {
					...state,
					code: action.payload,
				};
			default:
				return state;
		}
	};

	const initialState = {
		initContext: initialCode,
		code: initialCode,
		splitIndex: null,
		showCommentBox: false, // Initial state for comment box visibility
		decorations: [],
		content: [],
	};

	// TODO: Need to remove this in the final integration
	useEffect(() => {
		const data = {
			email: "user@example.com",
			fullNames: "Actual Full Name",
			user: "Actual User",
			pwd: "Actual Password",
			method: "Actual Method",
			accessToken: "Actual Access Token",
			refreshToken: "Actual Refresh Token",
			id_token: "Actual ID Token",
		};

		axios
			.post("https://api.magnifio.io/auth/temp-sign-in", data, {
				headers: {
					"Content-Type": "application/json",
				},
			})
			.then((response) => {
				setAccessToken(response.data.jwt.access_token);
			})
			.catch((error) => {
				console.error(
					"Error:",
					error.response ? error.response.data : error.message
				);
			});
	}, []);

	const [state, dispatch] = useReducer(editorReducer, initialState);

	const editorDidMount = (editor, monaco, editorId) => {
		editor.focus();
		if (editorId === "first") {
			setFirstEditor(editor);
			setMonacoRef(monaco);
		} else {
			setSecondEditor(editor);
		}

		let startLineNumber = null;
		let endLineNumber = null;
		let decorations = [];
		let highlightedContent = [];
		initialState.content = [];

		editor.onMouseDown((e) => {
			if (
				e.target.type ===
				monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS
			) {
				const { lineNumber } = e.target.position;

				if (e.event.shiftKey) {
					if (startLineNumber === null) {
						startLineNumber = lineNumber;
					} else {
						endLineNumber = lineNumber;
						const fromLineNumber = Math.min(
							startLineNumber,
							endLineNumber
						);
						const toLineNumber = Math.max(
							startLineNumber,
							endLineNumber
						);
						console.log("fromLineNumber", fromLineNumber);
						console.log("toLineNumber", toLineNumber);
						highlightedContent = [];
						for (
							let i = fromLineNumber - 1;
							i < toLineNumber;
							i++
						) {
							const contentHash = {
								lineNumber: i + 1,
								content: editor.getModel().getLineContent(i),
							};
							highlightedContent.push(contentHash);
						}

						// Remove previous decorations
						decorations = editor.deltaDecorations(decorations, []);

						// Add new decoration for the selected lines
						decorations = editor.deltaDecorations(
							[],
							[
								{
									range: new monaco.Range(
										fromLineNumber,
										1,
										toLineNumber,
										1
									),
									options: {
										isWholeLine: true,
										className: "line-highlight",
									},
								},
							]
						);
						state.decorations = decorations;

						dispatch({
							type: "TOGGLE_SPLIT_INDEX",
							payload:
								editorId === "second"
									? toLineNumber
									: toLineNumber - 1,
							editor: editor,
						});

						startLineNumber = null;
						endLineNumber = null;
					}
				} else {
					startLineNumber = null;
					endLineNumber = null;
					highlightedContent = [];
					initialState.content = [];
					// Remove previous decorations
					decorations = editor.deltaDecorations(decorations, []);
					// Add new decoration for the selected lines
					decorations = editor.deltaDecorations(
						[],
						[
							{
								range: new monaco.Range(
									lineNumber,
									1,
									lineNumber,
									1
								),
								options: {
									isWholeLine: true,
									className: "line-highlight",
								},
							},
						]
					);
					state.decorations = decorations;
					highlightedContent.push({
						lineNumber: lineNumber,
						content: editor.getModel().getLineContent(lineNumber),
					});

					dispatch({
						type: "TOGGLE_SPLIT_INDEX",
						payload:
							editorId === "second" ? lineNumber : lineNumber - 1,
						editor: editor,
					});
				}
				initialState.content = [];
				initialState.content = highlightedContent;
			}
		});
	};

	const onChange = (newValue, e) => {
		dispatch({ type: "SET_CODE", payload: newValue });
	};

	const handleReqestChange = (event) => {
		setModRequest(event.target.value);
	};

	const changeRequest = (
		content,
		code,
		accessToken,
		firstIde,
		secondIde,
		monaco,
		retryBool = false
	) => {
		console.log("content", content);
		const formData = new FormData();
		formData.append("userID", "65b02df820411fa73b9e5b56");
		formData.append("code_input", JSON.stringify(content));
		formData.append("modification", modRequest);
		formData.append("storageID", "a1108558-0f2a-11ef-93f1-4a806d129948");
		console.log("formData", formData);
		if (retryBool) {
			formData.append("retry", "true");
		}
		axios
			.post(
				"https://api.magnifio.io/actions/alpha/code-modification",
				formData,
				{
					headers: {
						"Content-Type": "multipart/form-data", // This will be set automatically with the correct boundary by Axios
						Authorization: "Bearer " + accessToken,
					},
				}
			)
			.then((response) => {
				console.log("Response:", response);
				const context = response.data.context_output;
				// TODO: Highlight the lines with the changes
				// if we remove the second editor then lines are displaying but not on the right line number
				// TODO: create button to accept changes
				// make sure changes that the user has made are being noticed
				const modified_lines = response.data.modified_lines;
				dispatch({
					type: "CODE_MODIFIED",
					payload: context,
				});

				let firstIDEDecorations = [];
				firstIDEDecorations = firstIde.deltaDecorations(
					firstIDEDecorations,
					[]
				);

				let secondIDEDecorations = [];
				secondIDEDecorations = secondIde.deltaDecorations(
					secondIDEDecorations,
					[]
				);

				modified_lines.map((line_number) => {
					console.log("line_number", line_number);
				});

				const newDecorationsFirstIDE = modified_lines.map(
					(line_number) => {
						// Log the current line number being processed
						console.log(
							"Highlighting line number first ide:",
							line_number
						);
						try {
							const lineLength = firstIde
								.getModel()
								.getLineContent(line_number).length;

							return {
								range: new monaco.Range(
									line_number,
									1,
									line_number,
									lineLength
								),
								options: {
									isWholeLine: true,
									className: "line-modification-highlight",
								},
							};
						} catch (err) {
							console.log("Error", err, line_number);
						}
					}
				);

				const newDecorationsSecondIDE = modified_lines.map(
					(line_number) => {
						// Log the current line number being processed
						console.log(
							"Highlighting line number second ide:",
							line_number
						);
						try {
							const lineLength = firstIde
								.getModel()
								.getLineContent(line_number).length;

							return {
								range: new monaco.Range(
									line_number,
									1,
									line_number,
									lineLength
								),
								options: {
									isWholeLine: true,
									className: "line-modification-highlight",
								},
							};
						} catch (err) {
							console.log("Error", err, line_number);
						}
					}
				);
				firstIDEDecorations = firstIde.deltaDecorations(
					[],
					newDecorationsFirstIDE
				);
				secondIDEDecorations = secondIde.deltaDecorations(
					[],
					newDecorationsSecondIDE
				);
			})
			.catch((error) => {
				console.error(
					"Error:",
					error.response ? error.response.data : error.message
				);
			});

		// TODO: Issue with highlighting where its not highlighting the right lines
		// You can test with the following code instead of waiting for a response
		// editor.deltaDecorations([], []);
		// const modified_lines = [11, 14, 22];
		// const newDecorations = modified_lines.map((line_number) => {
		// 	// Log the current line number being processed
		// 	console.log("Highlighting line number:", line_number);

		// 	return {
		// 		range: new monaco.Range(line_number, 1, line_number, 0),
		// 		options: {
		// 			isWholeLine: true,
		// 			className: "line-modification-highlight",
		// 		},
		// 	};
		// });
		// console.log("newDecorations", newDecorations);
		// editor.deltaDecorations([], newDecorations);
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
		const totalLinesCount = state.code.split("\n").length;
		if (state.splitIndex !== null) {
			const lines = state.splitIndex + 1;
			const estimatedLineHeight = 20; // Adjust this based on your CSS

			const lineRemainder = totalLinesCount - lines;
			setFirstEditorHeight(`${lines * estimatedLineHeight}px`);
			setSecondEditorHeight(`${lineRemainder * estimatedLineHeight}px`);
		} else {
			setFirstEditorHeight("100%");
			setSecondEditorHeight("0%");
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
				theme="vs-light"
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
						value={modRequest}
						onChange={handleReqestChange}
					/>
					<div>
						<button
							onClick={() =>
								dispatch({ type: "TOGGLE_COMMENT_BOX" })
							}
						>
							Cancel
						</button>
						<button
							onClick={() => {
								changeRequest(
									state.content,
									state.initContext,
									accessToken,
									firstEditor,
									secondEditor,
									monacoRef
								);
								dispatch({ type: "TOGGLE_COMMENT_BOX" });
								// TODO: create a method to hide/unhide accept changes button
								// TODO: create a method to hide/unhide retry button
							}}
						>
							Submit Comment
						</button>
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
					height={secondEditorHeight} // Adjust if necessary
					language="python"
					theme="vs-light"
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
