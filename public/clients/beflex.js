(function () {
  // ── BeFlex-specific CSS ──
  var style = document.createElement("style");
  style.textContent = `
    .echo-qr-btn.pc-selected {
      background: var(--echo-primary, #2d5a8f);
      color: #fff;
      border-color: var(--echo-primary, #2d5a8f);
    }
    .pc-amenity-picker {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 8px 12px;
    }
    .pc-continue-btn {
      display: block;
      width: calc(100% - 24px);
      margin: 4px 12px 8px;
      padding: 10px;
      background: var(--echo-primary, #2d5a8f);
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }
    .pc-continue-btn:hover {
      opacity: 0.9;
    }
  `;
  document.head.appendChild(style);

  // ── Hook in after widget is ready ──
  document.addEventListener("echo:widget_ready", function (e) {
    if (e.detail.client_id !== "beflex") return;

    var api = window.__ECHO_WIDGET_API__;

    // ── Property Checker Wizard ──
    api.registerAction("property_checker", function () {
      var pcCriteria = {};

      api.clearQuickReplies();
      api.clearActiveForm();

      setTimeout(function () {
        api.addBotMsg("Let's find your perfect workspace!\n\n**Which city are you looking in?**");
        api.showSingleChips(
          ["London", "Manchester", "Bristol", "Leeds", "Birmingham", "Edinburgh"],
          function (val) {
            pcCriteria.city = val;
            api.addUserMsg(val);
            pcAskTeamSize();
          }
        );
      }, 300);

      function pcAskTeamSize() {
        setTimeout(function () {
          api.addBotMsg("**How many people need desks?**");
          api.showSingleChips(
            ["1\u20135 people", "6\u201310 people", "11\u201325 people", "26\u201350 people", "50+ people"],
            function (val) {
              pcCriteria.teamSize = val;
              api.addUserMsg(val);
              pcAskBudget();
            }
          );
        }, 400);
      }

      function pcAskBudget() {
        setTimeout(function () {
          api.addBotMsg("**What's your max budget per desk per month?**");
          api.showSingleChips(
            ["Under \u00a3300", "Up to \u00a3500", "Up to \u00a3700", "Up to \u00a31,000", "No limit"],
            function (val) {
              pcCriteria.budgetLabel = val;
              var m = val.match(/\u00a3\s*([\d,]+)/);
              pcCriteria.maxBudget = m ? parseInt(m[1].replace(/,/g, ""), 10) : 0;
              api.addUserMsg(val);
              pcAskAmenities();
            }
          );
        }, 400);
      }

      function pcAskAmenities() {
        setTimeout(function () {
          api.addBotMsg("Any must-have amenities? **Select all that apply**, then tap Continue.");
          var amenityList = ["WiFi", "Meeting Rooms", "Gym", "Shower", "Cafe", "24/7 Access", "Bike Storage", "Reception", "Event Space"];
          var selected = new Set();

          api.clearQuickReplies();
          var row = document.createElement("div");
          row.className = "pc-amenity-picker";

          amenityList.forEach(function (a) {
            var btn = document.createElement("button");
            btn.className = "echo-qr-btn";
            btn.textContent = a;
            btn.onclick = function () {
              if (selected.has(a)) {
                selected.delete(a);
                btn.classList.remove("pc-selected");
              } else {
                selected.add(a);
                btn.classList.add("pc-selected");
              }
              contBtn.textContent = selected.size > 0 ? "Continue \u2192" : "Skip \u2192";
            };
            row.appendChild(btn);
          });

          var contBtn = document.createElement("button");
          contBtn.className = "pc-continue-btn";
          contBtn.textContent = "Skip \u2192";
          contBtn.onclick = function () {
            row.remove();
            pcCriteria.amenities = Array.from(selected);
            var label = pcCriteria.amenities.length > 0
              ? pcCriteria.amenities.join(", ")
              : "No specific requirements";
            api.addUserMsg(label);
            pcAskContact();
          };
          row.appendChild(contBtn);

          api.appendToMessages(row);
        }, 400);
      }

      function pcAskContact() {
        setTimeout(function () {
          api.addBotMsg("Almost there! \uD83C\uDF89 Pop in your details and I'll show you the matching spaces right now.");
          api.showContactForm(pcCriteria);
        }, 400);
      }
    });
  });

  // ── React to lead captured — open results panel ──
  document.addEventListener("echo:lead_captured", function (e) {
    if (typeof window.brpOpen === "function") {
      window.brpOpen(e.detail || {});
    }
  });
}());
