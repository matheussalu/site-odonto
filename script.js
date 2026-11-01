(() => {
  const STORAGE_KEY = "odonto_agendamentos";
  let agendamentos = load();
  let filtro = "todos";

  const $ = (id) => document.getElementById(id);
  const form = $("form-agendamento");
  const lista = $("lista");
  const vazio = $("vazio");
  const erro = $("erro");

  const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(agendamentos));
  }

  function formatDate(iso) {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  }

  function escapeHtml(s) {
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function renderFinance() {
    const concluidos = agendamentos.filter((a) => a.concluido);
    const total = concluidos.reduce((sum, a) => sum + a.valor, 0);
    $("total-concluido").textContent = brl.format(total);
    $("qtd-concluidos").textContent = concluidos.length;
    $("qtd-pendentes").textContent = agendamentos.length - concluidos.length;
  }

  function renderList() {
    const itens = agendamentos
      .filter((a) =>
        filtro === "todos" ? true : filtro === "concluido" ? a.concluido : !a.concluido
      )
      .sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));

    lista.innerHTML = itens
      .map(
        (a) => `
        <li class="item ${a.concluido ? "done" : ""}">
          <div>
            <div class="item__name">${escapeHtml(a.paciente)}
              <span class="badge">${a.concluido ? "Concluído" : "Pendente"}</span>
            </div>
            <div class="item__service">${escapeHtml(a.servico)}</div>
            <div class="item__meta">
              <span>📅 ${formatDate(a.data)}</span>
              <span>🕒 ${a.hora}</span>
              <span class="item__value">${brl.format(a.valor)}</span>
            </div>
          </div>
          <div class="item__actions">
            <button class="btn ${a.concluido ? "btn--undo" : "btn--done"}" data-action="toggle" data-id="${a.id}">
              ${a.concluido ? "Reabrir" : "✔ Concluir"}
            </button>
            <button class="btn btn--del" data-action="delete" data-id="${a.id}" aria-label="Excluir">🗑</button>
          </div>
        </li>`
      )
      .join("");

    vazio.hidden = itens.length > 0;
  }

  function render() {
    renderList();
    renderFinance();
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const paciente = $("paciente").value.trim();
    const data = $("data").value;
    const hora = $("hora").value;
    const servico = $("servico").value.trim();
    const valor = parseFloat($("valor").value);

    if (!paciente || !data || !hora || !servico || isNaN(valor) || valor < 0) {
      erro.textContent = "Preencha todos os campos corretamente.";
      erro.hidden = false;
      return;
    }
    erro.hidden = true;

    agendamentos.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      paciente, data, hora, servico, valor,
      concluido: false,
    });
    save();
    form.reset();
    render();
  });

  lista.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const { action, id } = btn.dataset;
    if (action === "toggle") {
      const a = agendamentos.find((x) => x.id === id);
      if (a) a.concluido = !a.concluido;
    } else if (action === "delete") {
      if (!confirm("Excluir este agendamento?")) return;
      agendamentos = agendamentos.filter((x) => x.id !== id);
    }
    save();
    render();
  });

  document.querySelectorAll(".chip").forEach((chip) =>
    chip.addEventListener("click", () => {
      filtro = chip.dataset.filter;
      document.querySelectorAll(".chip").forEach((c) => c.classList.toggle("is-active", c === chip));
      renderList();
    })
  );

  render();
})();
