from flask import Flask, render_template, request, jsonify, send_from_directory
import re
import torch
from flask_cors import CORS
from langchain.prompts import PromptTemplate
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_community.llms import CTransformers
from langchain.chains import RetrievalQA


# Path to the FAISS database
DB_FAISS_PATH = "vectorstores/db_faiss"
app = Flask(__name__)
CORS(app)


# Global variables for the QA chain and other components
qa_chain = None


# Simplified prompt template for faster generation
custom_prompt_template = """Answer the following question using the given context.
Context: {context}
Question: {question}
Helpful answer:
"""


def set_custom_prompt():
    """Prompt template for QA retrieval."""
    prompt = PromptTemplate(template=custom_prompt_template, input_variables=["context", "question"])
    return prompt


def load_llm():
    """Load the language model."""
    # Adjusted max_new_tokens for faster generation
    llm = CTransformers(
        model="TheBloke/llama-2-7b-chat-GGML",
        model_type="llama",
        max_new_tokens=256,  # Reduced tokens to speed up response
        temperature=0.9,  # Lower temperature for faster, more deterministic results
        n_threads=24,  # Utilize all 24 logical processors
        n_batch=1000
    )
    return llm


def retrieval_qa_chain(llm, prompt, db):
    """Create a RetrievalQA chain."""
    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=db.as_retriever(search_kwargs={"k": 1}),  # Reduce the number of documents retrieved to 1
        chain_type_kwargs={"prompt": prompt},
        return_source_documents=False  # Do not return source docs to reduce overhead
    )
    return qa_chain


def initialize_qa_bot():
    """Initialize the QA bot and store it in a global variable."""
    global qa_chain
    device = 'cpu'  # Test on CPU even if CUDA is available
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2", model_kwargs={'device': device})

   
    try:
        db = FAISS.load_local(DB_FAISS_PATH, embeddings, allow_dangerous_deserialization=True)
    except Exception as e:
        print(f"Error loading FAISS database: {e}")
        return None
    llm = load_llm()
    qa_prompt = set_custom_prompt()
    qa_chain = retrieval_qa_chain(llm, qa_prompt, db)

@app.route('/api/question', methods=['POST'])
def ask_question():
    try:
        data = request.get_json()
        question = data.get('question')

        if not is_valid_query(question):
            return jsonify({"reply": "Nothing matched. Please enter a valid query."})

        if qa_chain is None:
            return jsonify({"reply": "Failed to initialize QA bot."})

        res = qa_chain({'query': question})
        answer = res.get("result", "No answer found.")

        return jsonify({'reply': answer})
    except Exception as e:
        # Log full error stack trace for debugging
        import traceback
        print(traceback.format_exc())
        return jsonify({'reply': f"Error processing the question: {str(e)}"}), 500


def is_valid_query(query):
    """Check if the query is valid."""
    if not query or query.isspace():
        return False
    if not re.search(r'[a-zA-Z0-9]', query):
        return False
    return True


if __name__ == '__main__':
    initialize_qa_bot()  # Initialize the QA bot when the app starts
    app.run(debug=True,host='0.0.0.0',port=5000)
