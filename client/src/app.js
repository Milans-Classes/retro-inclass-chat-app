import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';

// UPDATED: No URL passed here. It defaults to the host serving the site.
const socket = io();

function App() {
  const [view, setView] = useState('LANDING'); 
  const [role, setRole] = useState(''); 
  const [threadId, setThreadId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [notes, setNotes] = useState([]);
  const [systemMsg, setSystemMsg] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    socket.on('thread_created', (id) => {
      setThreadId(id);
      setView('CHAT');
      setSystemMsg(`SESSION ESTABLISHED. ID: ${id}`);
    });

    socket.on('joined_success', (history) => {
      setNotes(history);
      setView('CHAT');
      setSystemMsg(`CONNECTION SUCCESSFUL. LINKED TO THREAD ${threadId}`);
    });

    socket.on('receive_note', (note) => {
      setNotes((prev) => [...prev, note]);
    });

    socket.on('system_message', (msg) => {
      setNotes((prev) => [...prev, { system: true, text: msg }]);
    });

    socket.on('thread_closed', () => {
      alert("SESSION TERMINATED BY HOST.");
      window.location.reload();
    });

    socket.on('error', (err) => {
      alert(`ERROR: ${err}`);
    });

    return () => socket.off();
  }, [threadId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [notes]);

  const createThread = () => {
    setRole('INSTRUCTOR');
    setName('SYSADMIN');
    socket.emit('create_thread');
  };

  const joinThread = () => {
    if (!threadId || !name || !email) return alert("MISSING CREDENTIALS");
    setRole('STUDENT');
    socket.emit('join_thread', { threadId, name, email });
  };

  const sendNote = (e) => {
    e.preventDefault();
    if (message.trim()) {
      socket.emit('send_note', { threadId, name, text: message });
      setMessage('');
    }
  };

  const closeSession = () => {
    if(window.confirm("TERMINATE SESSION AND SAVE DATA?")) {
      socket.emit('close_thread', threadId);
    }
  };

  if (view === 'LANDING') {
    return (
      <div className="crt-container">
        <div className="scanline"></div>
        <div className="content center-screen">
          <h1>CLASS_NOTES_OS v1.0</h1>
          <p>SELECT OPERATING MODE:</p>
          <div className="menu">
            <button onClick={createThread}>[ INSTRUCTOR MODE ]</button>
            <button onClick={() => setView('STUDENT_LOGIN')}>[ STUDENT LOGIN ]</button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'STUDENT_LOGIN') {
    return (
      <div className="crt-container">
        <div className="scanline"></div>
        <div className="content center-screen">
          <h2>ACCESS REQUEST</h2>
          <div className="form-group">
            <label>THREAD ID: </label>
            <input type="text" placeholder="####" onChange={(e) => setThreadId(e.target.value)} maxLength="4"/>
          </div>
          <div className="form-group">
            <label>CODENAME: </label>
            <input type="text" placeholder="NAME" onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label>CONTACT: </label>
            <input type="email" placeholder="EMAIL" onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button onClick={joinThread}>[ INITIATE UPLINK ]</button>
          <button className="text-btn" onClick={() => setView('LANDING')}>&lt; BACK</button>
        </div>
      </div>
    );
  }

  return (
    <div className="crt-container">
      <div className="scanline"></div>
      <div className="ui-layout">
        <header>
          <div className="status-bar">
            <span>USER: {name.toUpperCase()}</span>
            <span>THREAD: {threadId}</span>
            <span>STATUS: ONLINE</span>
            {role === 'INSTRUCTOR' && (
              <button className="danger-btn" onClick={closeSession}>[ TERM_SESSION ]</button>
            )}
          </div>
        </header>

        <div className="chat-window">
          {systemMsg && <div className="sys-msg"> &gt; {systemMsg}</div>}
          
          {notes.map((note, idx) => (
             note.system ? 
             <div key={idx} className="sys-msg">{note.text}</div> :
             <div key={idx} className="msg-line">
               <span className="timestamp">[{note.timestamp}]</span>
               <span className="username">&lt;{note.name}&gt;</span>
               <span className="message">{note.text}</span>
             </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <form className="input-area" onSubmit={sendNote}>
          <span>&gt;</span>
          <input 
            type="text" 
            value={message} 
            onChange={(e) => setMessage(e.target.value)} 
            autoFocus 
            placeholder="ENTER NOTE DATA..."
          />
        </form>
      </div>
    </div>
  );
}

export default App;