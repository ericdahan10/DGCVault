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

    /* ── Page blur — only fires at contact form step ── */
    .pc-page-blur > *:not(#echo-widget-root) {
      filter: blur(5px);
      pointer-events: none;
      user-select: none;
      transition: filter 0.35s ease;
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

      // ── Step 2: Team size ─────────────────────────────────────────────────
      function pcAskTeamSize() {
        setTimeout(function () {
          api.addBotMsg("**How many people need desks?**");
          api.showSingleChips(
            ["1\u20132", "3\u20135", "6\u201310", "11\u201325", "26\u201350", "50+"],
            function (val) {
              pcCriteria.teamSize = val;
              api.addUserMsg(val);
              pcAskBudget();
            }
          );
        }, 400);
      }

      // ── Step 3: Budget input ──────────────────────────────────────────────
      function pcAskBudget() {
        setTimeout(function () {
          api.addBotMsg("**What's your max monthly budget per desk?** (in \u00a3)");

          var row = document.createElement("div");
          row.className = "pc-input-row";
          var inp = document.createElement("input");
          inp.type = "number";
          inp.placeholder = "e.g. 500";
          inp.min = "0";
          var btn = document.createElement("button");
          btn.className = "pc-btn-primary";
          btn.textContent = "Next \u2192";

          function submit() {
            var raw = inp.value.trim();
            var val = parseInt(raw, 10);
            var label = raw ? "\u00a3" + val + "/desk/mo" : "No limit";
            row.remove();
            pcCriteria.maxBudget = val || 0;
            pcCriteria.budgetLabel = label;
            api.addUserMsg(label);
            pcAskAmenities();
          }

          var skipBtn = document.createElement("button");
          skipBtn.className = "pc-btn-skip";
          skipBtn.textContent = "Skip";
          skipBtn.onclick = function () {
            row.remove();
            pcCriteria.maxBudget = 0;
            pcCriteria.budgetLabel = "No limit";
            api.addUserMsg("No limit");
            pcAskAmenities();
          };

          btn.onclick = submit;
          inp.addEventListener("keydown", function (ev) { if (ev.key === "Enter") submit(); });
          row.appendChild(inp);
          row.appendChild(btn);
          row.appendChild(skipBtn);
          api.appendToMessages(row);
          setTimeout(function () { inp.focus(); }, 50);
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
          contBtn.textContent = "Continue \u2192";
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

      // ── Step 5: Contact form with blur ────────────────────────────────────
      function pcAskContact() {
        setTimeout(function () {
          api.addBotMsg("Almost there! Your matches are ready \ud83c\udf89\n\nEnter your details to unlock your results.");
          document.body.classList.add("pc-page-blur");
          api.showContactForm(pcCriteria, {
            title: "Unlock Your Results",
            subtitle: "Email and phone are required to see your matched spaces.",
            phoneRequired: true,
            onCancel: function () {
              document.body.classList.remove("pc-page-blur");
            }
          });
        }, 400);
      }
    });
  });

  // ── Lead captured — remove blur + open results panel ──
  document.addEventListener("echo:lead_captured", function (e) {
    document.body.classList.remove("pc-page-blur");
    if (typeof window.brpOpen === "function") {
      window.brpOpen(e.detail || {});
    }
  });
}());
