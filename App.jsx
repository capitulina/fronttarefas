import { useAppSession } from './session.js'
import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchAvaliacoes } from './api.js'
import { getRoles } from './auth.js'

function Icon({ name, size = 20, ...props }) {
  const paths = {
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 3H20v19H6.5A2.5 2.5 0 0 1 4 19.5v-14A2.5 2.5 0 0 1 6.5 3Z"/><path d="M8 7h8M8 11h6"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6"/>,
    search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/></>,
    exit: <><path d="M9 4H4v16h5m5-4 4-4-4-4M8 12h12"/></>,
    shield: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z"/><path d="m8 12 3 3 5-6"/></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    chart: <><path d="M4 20h17M7 15v-5m5 5V4m5 11V8"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    close: <path d="m6 6 12 12M18 6 6 18"/>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5"/><path d="M6 7a7 7 0 0 1 12-2l2 3M4 16l2 3a7 7 0 0 0 12-2"/></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name] || paths.book}</svg>
}

function Brand() { return <span className="brand"><span className="brand-mark"><Icon name="book" size={21}/></span>Avalia<span className="brand-dot">.</span></span> }

export default function App() {
  const { isLoading, isAuthenticated, error, loginWithRedirect } = useAppSession()
  const [loginError, setLoginError] = useState(null)
  if (isLoading) return <main className="configuration"><Brand/><div className="spinner"/><p>Preparando seu espaço…</p></main>
  if (!isAuthenticated || error) return <Landing error={error || loginError} onLogin={() => loginWithRedirect().catch(setLoginError)}/>
  return <Dashboard/>
}

function Landing({ onLogin, error }) {
  return <div className="landing">
    <header className="landing-header"><Brand/><span className="eyebrow">ESPAÇO ACADÊMICO</span></header>
    <main className="landing-content">
      <section className="landing-copy"><span className="section-label"><span className="status-dot"/> MAIS CLAREZA PARA APRENDER</span>
        <h1>Cada avaliação,<br/>uma nova <em>perspectiva.</em></h1>
        <p>Notas, matérias e professores em um só lugar.<br className="desktop-break"/> Um espaço simples para acompanhar avaliações acadêmicas.</p>
        <button className="primary login-button" onClick={onLogin}>Entrar na plataforma <Icon name="arrow"/></button>
        <span className="login-note"><Icon name="shield" size={16}/> Acesso seguro com sua conta</span>
        {error && <p className="notice error" role="alert">Não foi possível concluir o login. Tente novamente ou contate o administrador.</p>}
      </section>
      <section className="landing-art" aria-label="Organização, clareza e aprendizado">
        <div className="orbit orbit-one"/><div className="orbit orbit-two"/>
        <div className="art-card art-card-back"><span className="mini-line"/><span className="mini-line short"/><div className="art-bars"><i/><i/><i/><i/><i/></div></div>
        <div className="art-card art-card-main"><span className="art-icon"><Icon name="book" size={32}/></span><span className="section-label">SEU ESPAÇO DE APRENDIZADO</span><h2>Conhecimento<br/>em perspectiva.</h2><div className="art-divider"/><span className="art-check"><Icon name="check" size={16}/> Tudo no mesmo lugar</span></div>
        <span className="floating-pill"><span className="status-dot"/> Feito para simplificar</span>
        <span className="art-star">✳</span>
      </section>
    </main>
    <footer className="landing-footer"><span>Avaliações que conectam ensino e aprendizado.</span><span>AVALIA · PLATAFORMA ACADÊMICA</span></footer>
  </div>
}

export function Dashboard() {
  const { user, logout, getAccessTokenSilently, isLocalTest } = useAppSession()
  const [roles, setRoles] = useState([])
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [refresh, setRefresh] = useState(0)
  const [query, setQuery] = useState('')
  const [subject, setSubject] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [success, setSuccess] = useState('')
  const formRef = useRef(null)
  const isAdmin = roles.includes('ADMIN')

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      setLoading(true); setLoadError('')
      try {
        const token = await getAccessTokenSilently()
        if (controller.signal.aborted) return
        setRoles(isLocalTest ? ['ADMIN'] : getRoles(token))
        const data = await fetchAvaliacoes(token, { signal: controller.signal })
        if (!controller.signal.aborted) setRecords(data)
      } catch (error) {
        if (!controller.signal.aborted) setLoadError(error.message || 'Não foi possível carregar as avaliações.')
      } finally { if (!controller.signal.aborted) setLoading(false) }
    }
    load()
    return () => controller.abort()
  }, [getAccessTokenSilently, refresh, isLocalTest])

  useEffect(() => { if (showForm) formRef.current?.querySelector('input')?.focus() }, [showForm])

  const subjects = [...new Set(records.map(record => record.materia))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
  const average = records.length ? (records.reduce((sum, record) => sum + Number(record.nota), 0) / records.length).toLocaleString('pt-BR', { maximumFractionDigits: 2, minimumFractionDigits: 1 }) : '—'
  const filtered = useMemo(() => records.filter(record => {
    const text = [record.professor, record.materia, record.aluno].join(' ').toLocaleLowerCase('pt-BR')
    return text.includes(query.trim().toLocaleLowerCase('pt-BR')) && (!subject || record.materia === subject)
  }), [records, query, subject])

  async function save(form) {
    const token = await getAccessTokenSilently()
    const created = await fetchAvaliacoes(token, { method: 'POST', body: form })
    setRecords(current => [created, ...current].sort((a, b) => b.data.localeCompare(a.data) || b.id - a.id))
    setShowForm(false); setSuccess('Avaliação cadastrada com sucesso.'); setQuery(''); setSubject('')
  }

  return <div className="app-shell">
    <aside className="sidebar"><Brand/><div className="workspace-label">ESPAÇO ACADÊMICO</div>
      <nav aria-label="Menu principal"><a className="nav-item active" href="#avaliacoes"><Icon name="grid"/>Avaliações<span className="nav-indicator"/></a></nav>
      <div className="sidebar-note"><Icon name="book" size={25}/><p>Uma visão mais clara<br/>do aprendizado.</p><span>Organize. Acompanhe. Evolua.</span></div>
      <div className="sidebar-bottom"><span className="status-dot"/> Sua conexão com o conhecimento</div>
    </aside>
    <div className="main-shell">
      <header className="topbar"><div className="breadcrumb">Espaço acadêmico <span>/</span><strong>Avaliações</strong></div>
        <div className="user-menu"><div className="avatar">{(user?.name || user?.email || 'U').charAt(0).toUpperCase()}</div><div className="user-details"><strong>{user?.name || user?.email || 'Minha conta'}</strong><span>{isLocalTest ? 'Modo de teste' : isAdmin ? 'Administrador' : roles.includes('USER') ? 'Usuário' : loading ? 'Verificando acesso' : 'Acesso pendente'}</span></div>{!isLocalTest && <button className="icon-button" title="Sair da conta" aria-label="Sair da conta" onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}><Icon name="exit"/></button>}</div>
      </header>
      <main id="avaliacoes" className="dashboard">
        {isLocalTest && <div className="notice local-test-banner" role="status"><Icon name="shield" size={18}/><span>Teste local sem login · Os registros são consultados e gravados na sua API.</span></div>}
        <div className="page-heading"><div><span className="section-label">ENSINO EM PERSPECTIVA</span><h1>Avaliações<span>.</span></h1><p>Acompanhe os registros e encontre o que você precisa.</p></div>
          {isAdmin && <button className="primary" onClick={() => { setShowForm(true); setSuccess('') }} disabled={showForm}><Icon name="plus" size={18}/>Nova avaliação</button>}
        </div>
        <div className="stats" aria-label="Resumo das avaliações">
          <Stat label="Avaliações registradas" value={loading || loadError ? '—' : records.length.toLocaleString('pt-BR')} icon="book" detail="Todo o histórico em um lugar"/>
          <Stat label="Média das notas" value={loading || loadError ? '—' : average} icon="chart" detail="Escala de 0 a 10"/>
          <Stat label="Matérias avaliadas" value={loading || loadError ? '—' : subjects.length.toLocaleString('pt-BR')} icon="grid" detail="Diferentes áreas de conhecimento"/>
        </div>
        {success && <div className="notice success" role="status"><Icon name="check"/>{success}<button className="icon-button" aria-label="Fechar confirmação" onClick={() => setSuccess('')}><Icon name="close" size={16}/></button></div>}
        {showForm && isAdmin && <section className="form-panel" ref={formRef}><div className="panel-title"><div><span className="section-label">NOVO REGISTRO</span><h2>Cadastrar avaliação</h2></div><button className="icon-button" aria-label="Fechar formulário" onClick={() => setShowForm(false)}><Icon name="close"/></button></div><EvaluationForm onSave={save} onCancel={() => setShowForm(false)}/></section>}
        <section className="records-panel" aria-label="Lista de avaliações"><div className="list-heading"><div><h2>Todos os registros <span className="count-badge">{loadError ? '—' : records.length}</span></h2><p>Uma visão completa das avaliações cadastradas.</p></div><button className="secondary small" disabled={loading} onClick={() => setRefresh(value => value + 1)}><Icon name="refresh" size={16}/>{loading ? 'Atualizando…' : 'Atualizar'}</button></div>
          <div className="filters"><label className="search-box"><Icon name="search" size={18}/><span className="sr-only">Buscar avaliações</span><input placeholder="Buscar aluno, professor ou matéria…" value={query} onChange={event => setQuery(event.target.value)}/></label><label className="subject-filter"><span className="sr-only">Filtrar por matéria</span><select value={subject} onChange={event => setSubject(event.target.value)}><option value="">Todas as matérias</option>{subjects.map(name => <option key={name}>{name}</option>)}</select></label></div>
          {loading ? <div className="empty-state" role="status"><div className="spinner"/><p>Buscando suas avaliações…</p></div> : loadError ? <div className="empty-state"><span className="empty-icon"><Icon name="shield" size={26}/></span><h3>Não foi possível carregar</h3><p role="alert">{loadError}</p><button className="secondary" onClick={() => setRefresh(value => value + 1)}>Tentar novamente</button></div> : filtered.length ? <><div className="table-scroll"><table><thead><tr><th>Aluno</th><th>Matéria</th><th>Professor</th><th>Data</th><th className="grade-column">Nota</th></tr></thead><tbody>{filtered.map(record => <tr key={record.id}><td><span className="student-cell"><span className="student-avatar">{record.aluno.charAt(0).toUpperCase()}</span><strong>{record.aluno}</strong></span></td><td><span className="subject-tag">{record.materia}</span></td><td>{record.professor}</td><td className="date-cell">{formatDate(record.data)}</td><td className="grade-column"><span className="grade">{Number(record.nota).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}<small>/ 10</small></span></td></tr>)}</tbody></table></div><div className="list-footer"><span>Exibindo {filtered.length} de {records.length} avaliações</span><span>Organizado por data mais recente</span></div></> : <div className="empty-state"><span className="empty-icon"><Icon name="book" size={28}/></span><h3>{records.length ? 'Nenhuma avaliação encontrada' : 'O próximo aprendizado começa aqui'}</h3><p>{records.length ? 'Experimente outro termo ou ajuste o filtro de matéria.' : isAdmin ? 'Cadastre a primeira avaliação para começar a organizar os registros.' : 'As avaliações aparecerão aqui assim que forem cadastradas.'}</p>{records.length > 0 && <button className="secondary" onClick={() => { setQuery(''); setSubject('') }}>Limpar filtros</button>}</div>}
        </section>
        <footer className="dashboard-footer"><span><Icon name="shield" size={14}/> {isLocalTest ? 'Teste local de cadastro e consulta sem autenticação.' : isAdmin ? 'Você tem permissão para consultar e cadastrar avaliações.' : 'Seu espaço de consulta de avaliações.'}</span><span>AVALIA · ESPAÇO ACADÊMICO</span></footer>
      </main>
    </div>
  </div>
}

function Stat({ label, value, icon, detail }) { return <article className="stat-card"><div className="stat-top"><span>{label}</span><span className="stat-icon"><Icon name={icon} size={19}/></span></div><strong className="stat-number">{value}</strong><p>{detail}</p></article> }

function EvaluationForm({ onSave, onCancel }) {
  const [values, setValues] = useState({ professor: '', materia: '', data: '', nota: '', aluno: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fields, setFields] = useState({})
  async function submit(event) {
    event.preventDefault(); setSaving(true); setError(''); setFields({})
    try { await onSave({ ...values, professor: values.professor.trim(), materia: values.materia.trim(), aluno: values.aluno.trim(), nota: Number(values.nota) }) }
    catch (failure) { setError(failure.message); setFields(failure.fields || {}); setSaving(false) }
  }
  return <form onSubmit={submit}>
    <div className="form-grid">{[
      ['aluno', 'Aluno', 'text', 'Nome do aluno'], ['professor', 'Professor', 'text', 'Nome do professor'],
      ['materia', 'Matéria', 'text', 'Ex.: Engenharia de Software'], ['data', 'Data da avaliação', 'date', ''], ['nota', 'Nota', 'number', '0 a 10'],
    ].map(([name, label, type, placeholder]) => <label className={`field field-${name}`} key={name} htmlFor={name}><span>{label} <span className="required">*</span></span><input id={name} name={name} type={type} placeholder={placeholder} required maxLength={type === 'text' ? 150 : undefined} min={type === 'number' ? 0 : undefined} max={type === 'number' ? 10 : undefined} step={type === 'number' ? '0.01' : undefined} disabled={saving} value={values[name]} aria-invalid={!!fields[name]} aria-describedby={fields[name] ? `${name}-error` : undefined} onChange={event => setValues(current => ({ ...current, [name]: event.target.value }))}/>{fields[name] && <small id={`${name}-error`} className="field-error">{fields[name]}</small>}</label>)}</div>
    {error && <div className="notice error" role="alert">{error}</div>}
    <div className="form-actions"><span>Todos os campos são obrigatórios.</span><button className="secondary" type="button" disabled={saving} onClick={onCancel}>Cancelar</button><button className="primary" type="submit" disabled={saving}><Icon name="check" size={17}/>{saving ? 'Salvando…' : 'Salvar avaliação'}</button></div>
  </form>
}

function formatDate(date) { const [year, month, day] = date.split('-'); return `${day}/${month}/${year}` }
