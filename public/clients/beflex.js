(function () {
  // ── BeFlex-specific CSS ──
  var style = document.createElement("style");
  style.textContent = `
    /* ── Text / number input rows ── */
    .pc-input-row {
      display: flex;
      gap: 8px;
      padding: 8px 12px 12px;
    }
    .pc-input-row input {
      flex: 1;
      min-width: 0;
      background: rgba(255,255,255,0.07);
      border: 1.5px solid rgba(255,255,255,0.14);
      border-radius: 10px;
      color: inherit;
      font-size: 14px;
      font-family: inherit;
      padding: 10px 14px;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .pc-input-row input:focus {
      border-color: var(--echo-primary, #4a8ac7);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--echo-primary, #4a8ac7) 18%, transparent);
    }
    .pc-input-row input::placeholder { color: rgba(255,255,255,0.3); }
    .pc-input-row .pc-btn-primary {
      background: var(--echo-primary, #4a8ac7);
      color: #fff;
      border: none;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 700;
      padding: 10px 16px;
      cursor: pointer;
      white-space: nowrap;
      transition: opacity 0.15s;
    }
    .pc-input-row .pc-btn-primary:hover { opacity: 0.88; }
    .pc-input-row .pc-btn-skip {
      background: transparent;
      color: rgba(255,255,255,0.45);
      border: 1.5px solid rgba(255,255,255,0.14);
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      padding: 10px 14px;
      cursor: pointer;
      white-space: nowrap;
      transition: border-color 0.15s, color 0.15s;
    }
    .pc-input-row .pc-btn-skip:hover {
      border-color: rgba(255,255,255,0.3);
      color: rgba(255,255,255,0.7);
    }

    /* ── Budget min/max row ── */
    .pc-budget-row {
      padding: 8px 12px 12px;
    }
    .pc-budget-inputs {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
    }
    .pc-budget-field {
      flex: 1;
      min-width: 0;
      position: relative;
    }
    .pc-budget-field span {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 13px;
      color: rgba(255,255,255,0.45);
      pointer-events: none;
    }
    .pc-budget-field input {
      width: 100%;
      background: rgba(255,255,255,0.07);
      border: 1.5px solid rgba(255,255,255,0.14);
      border-radius: 10px;
      color: inherit;
      font-size: 14px;
      font-family: inherit;
      padding: 10px 14px 10px 26px;
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .pc-budget-field input:focus {
      border-color: var(--echo-primary, #4a8ac7);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--echo-primary, #4a8ac7) 18%, transparent);
    }
    .pc-budget-field input::placeholder { color: rgba(255,255,255,0.3); }
    .pc-budget-label {
      font-size: 10.5px;
      font-weight: 600;
      color: rgba(255,255,255,0.35);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 5px;
    }
    .pc-budget-actions {
      display: flex;
      gap: 8px;
    }
    .pc-budget-actions .pc-btn-primary {
      flex: 1;
      background: var(--echo-primary, #4a8ac7);
      color: #fff;
      border: none;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 700;
      padding: 10px 16px;
      cursor: pointer;
      transition: opacity 0.15s;
    }
    .pc-budget-actions .pc-btn-primary:hover { opacity: 0.88; }
    .pc-budget-actions .pc-btn-skip {
      background: transparent;
      color: rgba(255,255,255,0.45);
      border: 1.5px solid rgba(255,255,255,0.14);
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      padding: 10px 16px;
      cursor: pointer;
      white-space: nowrap;
      transition: border-color 0.15s, color 0.15s;
    }
    .pc-budget-actions .pc-btn-skip:hover {
      border-color: rgba(255,255,255,0.3);
      color: rgba(255,255,255,0.7);
    }

    /* ── Amenity checkboxes ── */
    .pc-checkbox-list {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px;
      padding: 8px 12px;
    }
    .pc-checkbox-list label {
      display: flex;
      align-items: center;
      gap: 9px;
      font-size: 13px;
      cursor: pointer;
      padding: 7px 10px;
      border-radius: 8px;
      border: 1.5px solid transparent;
      transition: background 0.15s, border-color 0.15s;
      user-select: none;
    }
    .pc-checkbox-list label:hover { background: rgba(255,255,255,0.06); }
    .pc-checkbox-list label:has(input:checked) {
      background: color-mix(in srgb, var(--echo-primary, #4a8ac7) 15%, transparent);
      border-color: color-mix(in srgb, var(--echo-primary, #4a8ac7) 50%, transparent);
    }
    .pc-checkbox-list input[type="checkbox"] {
      width: 15px;
      height: 15px;
      accent-color: var(--echo-primary, #4a8ac7);
      cursor: pointer;
      flex-shrink: 0;
    }
    .pc-continue-btn {
      display: block;
      width: calc(100% - 24px);
      margin: 6px 12px 12px;
      padding: 11px;
      background: var(--echo-primary, #2d5a8f);
      color: #fff;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: opacity 0.15s;
    }
    .pc-continue-btn:hover { opacity: 0.88; }

    /* ── Match count teaser ── */
    .pc-match-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: color-mix(in srgb, var(--echo-primary, #4a8ac7) 18%, transparent);
      border: 1px solid color-mix(in srgb, var(--echo-primary, #4a8ac7) 40%, transparent);
      border-radius: 20px;
      padding: 4px 12px;
      font-size: 12px;
      font-weight: 700;
      color: var(--echo-primary, #4a8ac7);
      margin: 0 auto 10px;
    }
    .pc-match-badge::before {
      content: "●";
      font-size: 8px;
      animation: pc-pulse 1.4s ease-in-out infinite;
    }
    @keyframes pc-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
  `;
  document.head.appendChild(style);

  // ── Hook in after widget is ready ──
  document.addEventListener("echo:widget_ready", function (e) {
    if (e.detail.client_id !== "beflex") return;

    var api = window.__ECHO_WIDGET_API__;

    api.registerAction("property_checker", function () {
      var pcCriteria = {};

      api.clearQuickReplies();
      api.clearActiveForm();

      // ── Step 1: Postcode ──────────────────────────────────────────────────
      setTimeout(function () {
        api.addBotMsg("Let's find your perfect workspace!\n\n**What's your postcode or area?**");

        var row = document.createElement("div");
        row.className = "pc-input-row";
        var inp = document.createElement("input");
        inp.type = "text";
        inp.placeholder = "e.g. EC1A, Manchester, Leeds";
        var btn = document.createElement("button");
        btn.className = "pc-btn-primary";
        btn.textContent = "Next \u2192";

        function submit() {
          var val = inp.value.trim();
          if (!val) { inp.focus(); return; }
          row.remove();
          pcCriteria.postcode = val;
          api.addUserMsg(val);
          pcAskTeamSize();
        }

        btn.onclick = submit;
        inp.addEventListener("keydown", function (ev) { if (ev.key === "Enter") submit(); });
        row.appendChild(inp);
        row.appendChild(btn);
        api.appendToMessages(row);
        setTimeout(function () { inp.focus(); }, 50);
      }, 300);

      // ── Step 2: Team size (number input) ──────────────────────────────────
      function pcAskTeamSize() {
        setTimeout(function () {
          api.addBotMsg("**How many people need desks?**");

          var row = document.createElement("div");
          row.className = "pc-input-row";
          var inp = document.createElement("input");
          inp.type = "number";
          inp.placeholder = "e.g. 8";
          inp.min = "1";

          var btn = document.createElement("button");
          btn.className = "pc-btn-primary";
          btn.textContent = "Next \u2192";

          function submit() {
            var raw = inp.value.trim();
            var val = parseInt(raw, 10);
            if (!raw || isNaN(val) || val < 1) { inp.focus(); return; }
            row.remove();
            pcCriteria.teamSize = val;
            api.addUserMsg(val + " " + (val === 1 ? "person" : "people"));
            pcAskBudget();
          }

          btn.onclick = submit;
          inp.addEventListener("keydown", function (ev) { if (ev.key === "Enter") submit(); });
          row.appendChild(inp);
          row.appendChild(btn);
          api.appendToMessages(row);
          setTimeout(function () { inp.focus(); }, 50);
        }, 400);
      }

      // ── Step 3: Monthly budget (min + max) ────────────────────────────────
      function pcAskBudget() {
        setTimeout(function () {
          api.addBotMsg("**What's your monthly budget?** (total, not per desk)");

          var wrap = document.createElement("div");
          wrap.className = "pc-budget-row";

          var inputs = document.createElement("div");
          inputs.className = "pc-budget-inputs";

          function makeField(labelText, placeholder) {
            var field = document.createElement("div");
            field.className = "pc-budget-field";
            var lbl = document.createElement("div");
            lbl.className = "pc-budget-label";
            lbl.textContent = labelText;
            var symbol = document.createElement("span");
            symbol.textContent = "\u00a3";
            var inp = document.createElement("input");
            inp.type = "number";
            inp.placeholder = placeholder;
            inp.min = "0";
            field.appendChild(lbl);
            field.appendChild(symbol);
            field.appendChild(inp);
            return { field: field, inp: inp };
          }

          var minF = makeField("Min", "e.g. 500");
          var maxF = makeField("Max", "e.g. 2000");
          inputs.appendChild(minF.field);
          inputs.appendChild(maxF.field);

          var actions = document.createElement("div");
          actions.className = "pc-budget-actions";

          var btn = document.createElement("button");
          btn.className = "pc-btn-primary";
          btn.textContent = "Next \u2192";

          var skipBtn = document.createElement("button");
          skipBtn.className = "pc-btn-skip";
          skipBtn.textContent = "No limit";

          function submit() {
            var minVal = parseInt(minF.inp.value, 10) || 0;
            var maxVal = parseInt(maxF.inp.value, 10) || 0;
            if (maxVal > 0 && minVal > maxVal) { minF.inp.focus(); return; }
            wrap.remove();
            var label;
            if (minVal && maxVal) {
              label = "\u00a3" + minVal + " \u2013 \u00a3" + maxVal + "/mo";
            } else if (maxVal) {
              label = "Up to \u00a3" + maxVal + "/mo";
            } else if (minVal) {
              label = "\u00a3" + minVal + "+/mo";
            } else {
              label = "No limit";
            }
            pcCriteria.budgetMin = minVal;
            pcCriteria.budgetMax = maxVal;
            pcCriteria.budgetLabel = label;
            api.addUserMsg(label);
            pcAskAmenities();
          }

          skipBtn.onclick = function () {
            wrap.remove();
            pcCriteria.budgetMin = 0;
            pcCriteria.budgetMax = 0;
            pcCriteria.budgetLabel = "No limit";
            api.addUserMsg("No limit");
            pcAskAmenities();
          };

          btn.onclick = submit;
          maxF.inp.addEventListener("keydown", function (ev) { if (ev.key === "Enter") submit(); });

          actions.appendChild(btn);
          actions.appendChild(skipBtn);
          wrap.appendChild(inputs);
          wrap.appendChild(actions);
          api.appendToMessages(wrap);
          setTimeout(function () { minF.inp.focus(); }, 50);
        }, 400);
      }

      // ── Step 4: Amenity checkboxes ────────────────────────────────────────
      function pcAskAmenities() {
        setTimeout(function () {
          api.addBotMsg("Any must-have amenities? **Check all that apply.**");

          var amenityList = [
            "WiFi", "Meeting Rooms", "Private Office", "Gym", "Shower",
            "Cafe / Kitchen", "24/7 Access", "Bike Storage", "Reception",
            "Event Space", "Printing", "Cleaning", "Parking", "Phone Booths"
          ];

          var list = document.createElement("div");
          list.className = "pc-checkbox-list";

          amenityList.forEach(function (a) {
            var lbl = document.createElement("label");
            var cb = document.createElement("input");
            cb.type = "checkbox";
            cb.value = a;
            lbl.appendChild(cb);
            lbl.appendChild(document.createTextNode(a));
            list.appendChild(lbl);
          });

          var contBtn = document.createElement("button");
          contBtn.className = "pc-continue-btn";
          contBtn.textContent = "Find My Spaces \u2192";
          contBtn.onclick = function () {
            var checked = Array.from(list.querySelectorAll("input:checked")).map(function (cb) { return cb.value; });
            list.remove();
            contBtn.remove();
            pcCriteria.amenities = checked;
            var label = checked.length > 0 ? checked.join(", ") : "No specific requirements";
            api.addUserMsg(label);
            pcAskContact();
          };

          api.appendToMessages(list);
          api.appendToMessages(contBtn);
        }, 400);
      }

      // ── Step 5: Contact form — no blur, show match count ──────────────────
      function pcAskContact() {
        // Simulate a match count (replace with real Strapi count later)
        var matchCount = 6 + Math.floor(Math.random() * 7); // 6–12
        pcCriteria.matchCount = matchCount;

        setTimeout(function () {
          api.addBotMsg(
            "We found **" + matchCount + " spaces** that match your search in **" + pcCriteria.postcode + "**.\n\n" +
            "Drop your details below to unlock the full list."
          );
          api.showContactForm(pcCriteria, {
            title: "\ud83c\udfe2 " + matchCount + " Spaces Ready for You",
            subtitle: "Free, no commitment — we\u2019ll send you the full matched list instantly.",
            phoneRequired: true,
          });
        }, 400);
      }
    });
  });

  // ── Lead captured — open results panel ──
  document.addEventListener("echo:lead_captured", function (e) {
    if (typeof window.brpOpen === "function") {
      window.brpOpen(e.detail || {});
    }
  });
}());
