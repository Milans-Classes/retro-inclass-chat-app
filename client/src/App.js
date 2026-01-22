import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';

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
      if (role === 'STUDENT') {
         alert("SESSION TERMINATED BY HOST.");
         window.location.reload();
      }
      // Instructor handles their own reload after save
    });

    socket.on('error', (err) => {
      alert(`ERROR: ${err}`);
    });

    return () => socket.off();
  }, [threadId, role]);

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

  // --- NEW: FUNCTION TO SAVE LOG FILE ---
  const saveLogsToPC = () => {
    // 1. Format the notes into a readable string
    const fileContent = notes.map(n => {
      if (n.system) return `[SYSTEM] ${n.text}`;
      return `[${n.timestamp}] <${n.name}> ${n.text}`;
    }).join('\n');

    const header = `CLASS LOG - THREAD ${threadId}\nDATE: ${new Date().toLocaleDateString()}\n----------------------------\n\n`;
    const fullContent = header + fileContent;

    // 2. Create a blob (virtual file)
    const blob = new Blob([fullContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    // 3. Trigger a download link programmatically
    const link = document.createElement('a');
    link.download = `class_log_${threadId}.txt`;
    link.href = url;
    link.click();
  };

  const closeSession = () => {
    if(window.confirm("TERMINATE SESSION AND DOWNLOAD LOGS?")) {
      // Save the file first
      saveLogsToPC();
      
      // Then close the room
      socket.emit('close_thread', threadId);
      
      // Reset view for instructor
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  if (view === 'LANDING') {
    return (
      <div className="crt-container">
        <div className="scanline"></div>
        <div className="content center-screen">
          <h1>Chat App!</h1>
          <p>University of Southern California -- 2026</p>
          <p>Note taking app for DSO 531</p>
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