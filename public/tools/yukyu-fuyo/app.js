const monthNames = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月"
];

const regularDays = [10, 11, 12, 14, 16, 18, 20];
const serviceLabels = ["0.5年", "1.5年", "2.5年", "3.5年", "4.5年", "5.5年", "6.5年以上"];
const proportionalDays = {
  4: { annual: "169日～216日", days: [7, 8, 9, 10, 12, 13, 15] },
  3: { annual: "121日～168日", days: [5, 6, 6, 8, 9, 10, 11] },
  2: { annual: "73日～120日", days: [3, 4, 4, 5, 6, 6, 7] },
  1: { annual: "48日～72日", days: [1, 2, 2, 2, 3, 3, 3] }
};

const patternLabels = {
  anniversary: "入社半年後に初回付与、以後は毎年同日",
  fixedAfterFirst: "初回は入社半年後、2回目以降は一斉付与日",
  fixedWithSixMonthCap: "一斉付与。ただし半年を超える場合は入社半年後に初回付与",
  splitInitial: "初回の一部を入社日に前倒し、残りを半年後に付与",
  splitThenFixed: "初回を分割付与、2回目以降は一斉付与日",
  hireDate: "初回も含め毎年入社日に付与",
  hireDateThenFixed: "初回は入社日、2回目以降は一斉付与日",
  semiAnnual: "上半期・下半期で付与日を分ける"
};

const patternDescriptions = {
  anniversary: "労基法どおり、入社から6か月後を起点に毎年付与します。",
  fixedAfterFirst: "初回だけ半年後。2回目以降を会社の一斉付与日にそろえます。",
  fixedWithSixMonthCap: "一斉付与日を優先しつつ、初回が半年を超えないようにします。",
  splitInitial: "初回10日を入社日と半年後に分けて付与する考え方です。",
  splitThenFixed: "初回は分割し、その後は会社の一斉付与日に寄せます。",
  hireDate: "入社日を基準日にして、毎年同じ日に付与します。",
  hireDateThenFixed: "初回は入社日に付与し、次回から一斉付与日にそろえます。",
  semiAnnual: "4月から9月、10月から3月など、半期ごとに付与日を分けます。"
};

const patternOrder = [
  "anniversary",
  "fixedAfterFirst",
  "fixedWithSixMonthCap",
  "splitInitial",
  "splitThenFixed",
  "hireDate",
  "hireDateThenFixed",
  "semiAnnual"
];

const fiscalMonths = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];

const form = document.querySelector("#paidLeaveForm");
const patternCards = document.querySelector("#patternCards");
const grantPattern = document.querySelector("#grantPattern");
const fixedMonth = document.querySelector("#fixedMonth");
const fixedDay = document.querySelector("#fixedDay");
const firstHalfGrantMonth = document.querySelector("#firstHalfGrantMonth");
const secondHalfGrantMonth = document.querySelector("#secondHalfGrantMonth");
const hireDate = document.querySelector("#hireDate");
const workType = document.querySelector("#workType");
const weeklyDays = document.querySelector("#weeklyDays");
const weeklyHours = document.querySelector("#weeklyHours");
const splitDays = document.querySelector("#splitDays");
const initialTotalDays = document.querySelector("#initialTotalDays");
const employeeName = document.querySelector("#employeeName");
const companyName = document.querySelector("#companyName");
const halfDayLeave = document.querySelector("#halfDayLeave");
const hourlyLeave = document.querySelector("#hourlyLeave");
const confirmButton = document.querySelector("#confirmButton");
const printButton = document.querySelector("#printButton");
const resultPanel = document.querySelector("#resultPanel");
const printPanel = document.querySelector("#printPanel");
const personSchedule = document.querySelector("#personSchedule");
const proportionalRows = document.querySelector("#proportionalRows");

function fillMonthSelect(select, selectedMonth) {
  select.innerHTML = monthNames
    .map((label, index) => `<option value="${index + 1}" ${index + 1 === selectedMonth ? "selected" : ""}>${label}</option>`)
    .join("");
}

fillMonthSelect(fixedMonth, 4);
fillMonthSelect(firstHalfGrantMonth, 10);
fillMonthSelect(secondHalfGrantMonth, 4);
const today = new Date();
hireDate.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;

proportionalRows.innerHTML = Object.entries(proportionalDays)
  .map(([daysPerWeek, row]) => `
    <tr>
      <td>週${daysPerWeek}日</td>
      <td>${row.annual}</td>
      ${row.days.map((day) => `<td>${day}日</td>`).join("")}
    </tr>
  `)
  .join("");

function clampDay(year, month, day) {
  return Math.min(day, new Date(year, month, 0).getDate());
}

function makeDate(year, month, day) {
  return new Date(year, month - 1, clampDay(year, month, day));
}

function addMonths(date, months) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1 + months;
  const targetYear = year + Math.floor((month - 1) / 12);
  const targetMonth = ((month - 1) % 12) + 1;
  return makeDate(targetYear, targetMonth, date.getDate());
}

function addYears(date, years) {
  return makeDate(date.getFullYear() + years, date.getMonth() + 1, date.getDate());
}

function formatDate(date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

function formatCompactDate(date) {
  return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
}

function formatShortDate(date) {
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

function formatRelativeTiming(baseDate, targetDate) {
  const monthDiff =
    (targetDate.getFullYear() - baseDate.getFullYear()) * 12 +
    targetDate.getMonth() -
    baseDate.getMonth();

  if (monthDiff === 0) return "入社時";
  if (monthDiff < 12) return `入社から${monthDiff}か月後`;
  if (monthDiff % 12 === 0) return `入社から${monthDiff / 12}年後`;
  return `入社から${Math.floor(monthDiff / 12)}年${monthDiff % 12}か月後`;
}

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function nextFixedDate(afterDate, month, day, allowSameDay = true) {
  let candidate = makeDate(afterDate.getFullYear(), month, day);
  if (candidate < afterDate || (!allowSameDay && dateKey(candidate) === dateKey(afterDate))) {
    candidate = makeDate(afterDate.getFullYear() + 1, month, day);
  }
  return candidate;
}

function getFirstSemiAnnualDate(hireDate) {
  const month = hireDate.getMonth() + 1;
  const grantMonth = month >= 4 && month <= 9 ? Number(firstHalfGrantMonth.value) : Number(secondHalfGrantMonth.value);
  const grantYear = grantMonth >= month ? hireDate.getFullYear() : hireDate.getFullYear() + 1;
  return makeDate(grantYear, grantMonth, Number(fixedDay.value));
}

function getGrantDays(index = 0) {
  if (workType.value === "regular" || Number(weeklyHours.value) >= 30) {
    return regularDays[Math.min(index, regularDays.length - 1)];
  }
  const days = proportionalDays[weeklyDays.value].days;
  return days[Math.min(index, days.length - 1)];
}

function getEmploymentNote() {
  if (workType.value === "regular" || Number(weeklyHours.value) >= 30) {
    return "通常付与の日数表を適用";
  }
  return `比例付与：週${weeklyDays.value}日、年間${proportionalDays[weeklyDays.value].annual}`;
}

function getPatternPreview(pattern) {
  const currentPattern = grantPattern.value;
  grantPattern.value = pattern;
  const sampleHireDate = makeDate(getFiscalBaseYear(), 4, 1);
  const sample = calculateForDate(sampleHireDate);
  grantPattern.value = currentPattern;

  return sample.timelineItems.slice(0, 4)
    .map((item) => ({
      date: item.date,
      label: item.title,
      daysLabel: item.daysLabel || ""
    }))
    .map((point) => ({
      ...point,
      timing: formatRelativeTiming(sampleHireDate, point.date)
    }));
}

function getFiscalBaseYear() {
  return Number((hireDate.value || "").slice(0, 4)) || new Date().getFullYear();
}

function getFiscalHireDate(month) {
  const baseYear = getFiscalBaseYear();
  return makeDate(month >= 4 ? baseYear : baseYear + 1, month, 1);
}

function getColumnDate(columnIndex) {
  return addMonths(makeDate(getFiscalBaseYear(), 4, 1), columnIndex);
}

function getColumnIndex(date) {
  return (
    (date.getFullYear() - getFiscalBaseYear()) * 12 +
    date.getMonth() -
    3
  );
}

function renderPatternMatrix(pattern) {
  const currentPattern = grantPattern.value;
  grantPattern.value = pattern;

  const columns = Array.from({ length: 36 }, (_, index) => getColumnDate(index));
  const fixedM = Number(fixedMonth.value);
  const fixedPattern = ["fixedAfterFirst", "fixedWithSixMonthCap", "splitThenFixed", "hireDateThenFixed"].includes(pattern);

  const headerYears = [1, 2, 3]
    .map((year) => `<th colspan="12">${year}年目</th>`)
    .join("");
  const headerMonths = columns
    .map((date) => {
      const month = date.getMonth() + 1;
      const fixedClass = fixedPattern && month === fixedM ? "is-fixed-month" : "";
      return `<th class="${fixedClass}">${month}</th>`;
    })
    .join("");

  const rows = fiscalMonths
    .map((month) => {
      const rowHireDate = getFiscalHireDate(month);
      const row = calculateForDate(rowHireDate);
      const hireIndex = getColumnIndex(rowHireDate);
      const eventsByColumn = new Map();

      row.timelineItems.forEach((item) => {
        const columnIndex = getColumnIndex(item.date);
        if (columnIndex < 0 || columnIndex >= columns.length) return;
        const existing = eventsByColumn.get(columnIndex) || [];
        existing.push(item);
        eventsByColumn.set(columnIndex, existing);
      });

      const cells = columns
        .map((date, index) => {
          const events = eventsByColumn.get(index) || [];
          const beforeHire = index < hireIndex;
          const monthNumber = date.getMonth() + 1;
          const fixedColumn = fixedPattern && monthNumber === fixedM;
          const hasGrant = events.length > 0;
          const cellClass = [
            beforeHire ? "is-before-hire" : "",
            fixedColumn ? "is-fixed-month" : "",
            hasGrant ? "has-grant" : "",
            fixedColumn && hasGrant ? "is-fixed-grant" : ""
          ].filter(Boolean).join(" ");
          const cellText = events.map((item) => `<span>${(item.daysLabel || "").replace("付与", "")}</span>`).join("");
          return `<td class="${cellClass}">${cellText}</td>`;
        })
        .join("");

      return `
        <tr>
          <th>${month}</th>
          ${cells}
        </tr>
      `;
    })
    .join("");

  grantPattern.value = currentPattern;

  return `
    <div class="matrix-wrap">
      <table class="pattern-matrix">
        <thead>
          <tr>
            <th rowspan="2" class="hire-month-heading">入社月</th>
            ${headerYears}
          </tr>
          <tr>${headerMonths}</tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderPatternCards() {
  patternCards.innerHTML = patternOrder
    .map((pattern) => {
      const checked = pattern === grantPattern.value;
      return `
        <div class="pattern-card ${checked ? "is-selected" : ""}" role="radio" tabindex="0" aria-checked="${checked}" data-pattern="${pattern}">
          <span class="pattern-card-top">
            <span class="pattern-radio" aria-hidden="true"></span>
            <span>
              <h3>${patternLabels[pattern]}</h3>
              <p>${patternDescriptions[pattern]}</p>
            </span>
          </span>
          ${renderPatternMatrix(pattern)}
        </div>
      `;
    })
    .join("");
}

function usesFixedGrantDate(pattern) {
  return !["anniversary", "splitInitial", "hireDate"].includes(pattern);
}

function renderPersonSchedule(hireDate, result) {
  const events = buildLongSchedule(hireDate);
  const fixedDateLabel = `${fixedMonth.value}月${fixedDay.value}日`;
  const employeeLabel = employeeName.value.trim() || "________________";
  const companyLabel = companyName.value.trim() || "________________";
  const meta = [
    `入社日：${formatDate(hireDate)}`,
    `雇用区分：${workType.value === "regular" || Number(weeklyHours.value) >= 30 ? "通常付与" : `比例付与 週${weeklyDays.value}日`}`
  ];

  if (usesFixedGrantDate(grantPattern.value)) {
    meta.push(`一斉付与日：${fixedDateLabel}`);
  }

  const leaveUnitNotes = [];
  if (halfDayLeave.checked) {
    leaveUnitNotes.push("半日単位の有給休暇を取得できます。利用条件や申請方法は就業規則・社内ルールを確認してください。");
  }
  if (hourlyLeave.checked) {
    leaveUnitNotes.push("時間単位の有給休暇を取得できます。取得できる時間数や申請方法は就業規則・労使協定・社内ルールを確認してください。");
  }

  return `
    <div class="print-sheet-header">
      <div class="recipient-line"><span>${employeeLabel}</span> 様</div>
      <div class="company-line">${companyLabel}</div>
    </div>
    <div class="schedule-title">
      <h2>${formatDate(hireDate)}入社の有給の付与日と日数</h2>
    </div>
    <div class="schedule-meta">
      ${meta.map((item) => `<span>${item}</span>`).join("")}
    </div>
    <div class="schedule-strip">
      ${events.map((item, index) => {
        const fixed = item.isFixedGrant;
        const isEntry = !item.daysLabel;
        return `
          <article class="schedule-event ${fixed ? "is-fixed" : ""} ${isEntry ? "is-entry" : ""}">
            <span class="event-number">${isEntry ? "入" : index}</span>
            <span class="event-kind ${fixed ? "fixed" : "individual"}">${isEntry ? "入社日" : fixed ? "一斉付与" : "個別付与"}</span>
            <strong class="event-date">${formatCompactDate(item.date)}</strong>
            <strong class="event-days">${item.daysLabel || "入社日"}</strong>
            <div class="event-title">${item.daysLabel ? item.title : "付与開始の基準日"}</div>
          </article>
        `;
      }).join("")}
    </div>
    <p class="after-20-note">20日付与に到達した後は、以後も法定上限の20日が付与されます。</p>
    <div class="legal-notes">
      <h3>年次有給休暇について</h3>
      <ul>
        <li>年次有給休暇は、付与日から2年間利用できます。</li>
        <li>10日以上の年次有給休暇が付与される場合、付与日から1年以内に5日以上取得する必要があります。</li>
        <li>年次有給休暇の付与には、継続勤務と出勤率8割以上などの要件があります。</li>
        <li>年次有給休暇は有給で休む制度のため、取得したことを理由に賃金を減額することはできません。</li>
        <li>取得希望日は会社の運用ルールに沿って申請してください。業務上必要がある場合、会社が時季変更を行うことがあります。</li>
        ${leaveUnitNotes.map((note) => `<li>${note}</li>`).join("")}
      </ul>
    </div>
  `;
}

function buildLongSchedule(hireDate) {
  const pattern = grantPattern.value;
  const fixedM = Number(fixedMonth.value);
  const fixedD = Number(fixedDay.value);
  const halfYear = addMonths(hireDate, 6);
  const events = [{ date: hireDate, title: "入社日", daysLabel: "", isFixedGrant: false }];
  const maxIndex = 6;
  const pushGrant = (date, dayIndex, title, isFixedGrant) => {
    events.push({
      date,
      title,
      daysLabel: `${getGrantDays(dayIndex)}日付与`,
      isFixedGrant
    });
  };

  if (pattern === "anniversary") {
    for (let i = 0; i <= maxIndex; i += 1) {
      pushGrant(addYears(halfYear, i), i, i === 0 ? "初回付与" : `${i + 1}回目付与`, false);
    }
    return events;
  }

  if (pattern === "fixedAfterFirst") {
    pushGrant(halfYear, 0, "初回付与", false);
    let next = nextFixedDate(halfYear, fixedM, fixedD, false);
    for (let i = 1; i <= maxIndex; i += 1) {
      pushGrant(next, i, `${i + 1}回目付与`, true);
      next = addYears(next, 1);
    }
    return events;
  }

  if (pattern === "fixedWithSixMonthCap") {
    const fixedAfterHire = nextFixedDate(hireDate, fixedM, fixedD);
    const first = fixedAfterHire > halfYear ? halfYear : fixedAfterHire;
    pushGrant(first, 0, "初回付与", dateKey(first) === dateKey(fixedAfterHire));
    let next = nextFixedDate(first, fixedM, fixedD, false);
    for (let i = 1; i <= maxIndex; i += 1) {
      pushGrant(next, i, `${i + 1}回目付与`, true);
      next = addYears(next, 1);
    }
    return events;
  }

  if (pattern === "splitInitial" || pattern === "splitThenFixed") {
    const firstDays = getGrantDays(0);
    const split = Math.min(Number(splitDays.value), Number(initialTotalDays.value), firstDays);
    const remaining = Math.max(firstDays - split, 0);
    events.push({ date: hireDate, title: "入社日分割付与", daysLabel: `${split}日付与`, isFixedGrant: false });
    events.push({ date: halfYear, title: "初回残日数の付与", daysLabel: `${remaining}日付与`, isFixedGrant: false });
    let next = pattern === "splitThenFixed" ? nextFixedDate(hireDate, fixedM, fixedD, false) : addYears(hireDate, 1);
    for (let i = 1; i <= maxIndex; i += 1) {
      pushGrant(next, i, `${i + 1}回目付与`, pattern === "splitThenFixed");
      next = addYears(next, 1);
    }
    return events;
  }

  if (pattern === "hireDate" || pattern === "hireDateThenFixed") {
    pushGrant(hireDate, 0, "初回付与", false);
    let next = pattern === "hireDateThenFixed" ? nextFixedDate(hireDate, fixedM, fixedD, false) : addYears(hireDate, 1);
    for (let i = 1; i <= maxIndex; i += 1) {
      pushGrant(next, i, `${i + 1}回目付与`, pattern === "hireDateThenFixed");
      next = addYears(next, 1);
    }
    return events;
  }

  if (pattern === "semiAnnual") {
    let first = getFirstSemiAnnualDate(hireDate);
    pushGrant(first, 0, "初回付与", true);
    let next = addYears(first, 1);
    for (let i = 1; i <= maxIndex; i += 1) {
      pushGrant(next, i, `${i + 1}回目付与`, true);
      next = addYears(next, 1);
    }
    return events;
  }

  return events;
}

function calculateForDate(hireDate) {
  const pattern = grantPattern.value;
  const fixedM = Number(fixedMonth.value);
  const fixedD = Number(fixedDay.value);
  const halfYear = addMonths(hireDate, 6);
  const firstDays = getGrantDays(0);
  const secondDays = getGrantDays(1);
  const split = Math.min(Number(splitDays.value), Number(initialTotalDays.value), firstDays);
  const remaining = Math.max(firstDays - split, 0);
  let firstGrant = halfYear;
  let secondGrant = addYears(halfYear, 1);
  let firstLabel = `${firstDays}日`;
  let memo = getEmploymentNote();
  const timelineItems = [];

  if (pattern === "anniversary") {
    firstGrant = halfYear;
    secondGrant = addYears(firstGrant, 1);
  }

  if (pattern === "fixedAfterFirst") {
    firstGrant = halfYear;
    secondGrant = nextFixedDate(firstGrant, fixedM, fixedD, false);
    memo += "。初回は半年後、以後は一斉付与日";
  }

  if (pattern === "fixedWithSixMonthCap") {
    const fixedAfterHire = nextFixedDate(hireDate, fixedM, fixedD);
    firstGrant = fixedAfterHire > halfYear ? halfYear : fixedAfterHire;
    secondGrant = nextFixedDate(firstGrant, fixedM, fixedD, false);
    memo += fixedAfterHire > halfYear ? "。一斉付与日が半年を超えるため初回は半年後" : "。初回から一斉付与日に付与";
  }

  if (pattern === "splitInitial") {
    firstGrant = hireDate;
    secondGrant = halfYear;
    firstLabel = `${split}日 + ${remaining}日`;
    memo += "。初回分を入社日と半年後に分割";
    timelineItems.push({
      date: hireDate,
      title: "入社日分割付与",
      daysLabel: `${split}日付与`,
      isFixedGrant: false,
      body: `${split}日を前倒し付与`
    });
    timelineItems.push({
      date: halfYear,
      title: "初回残日数の付与",
      daysLabel: `${remaining}日付与`,
      isFixedGrant: false,
      body: `${remaining}日を付与`
    });
    timelineItems.push({
      date: addYears(hireDate, 1),
      title: "2年目付与",
      daysLabel: `${secondDays}日付与`,
      isFixedGrant: false,
      body: `${secondDays}日。分割付与日は入社日が基準になります`
    });
    return { firstGrant, secondGrant, firstLabel, memo, timelineItems };
  }

  if (pattern === "splitThenFixed") {
    firstGrant = hireDate;
    const firstFixed = nextFixedDate(addYears(hireDate, 1), fixedM, fixedD);
    secondGrant = firstFixed > addYears(hireDate, 1) ? addYears(hireDate, 1) : firstFixed;
    firstLabel = `${split}日 + ${remaining}日`;
    memo += "。初回分割、2回目以降は一斉付与日を確認";
    timelineItems.push({ date: hireDate, title: "入社日分割付与", daysLabel: `${split}日付与`, isFixedGrant: false, body: `${split}日を前倒し付与` });
    timelineItems.push({ date: halfYear, title: "初回残日数の付与", daysLabel: `${remaining}日付与`, isFixedGrant: false, body: `${remaining}日を付与` });
    timelineItems.push({ date: secondGrant, title: "2回目付与", daysLabel: `${secondDays}日付与`, isFixedGrant: true, body: `${secondDays}日` });
    return { firstGrant, secondGrant, firstLabel, memo, timelineItems };
  }

  if (pattern === "hireDate") {
    firstGrant = hireDate;
    secondGrant = addYears(hireDate, 1);
    memo += "。初回から入社日を基準に毎年付与";
  }

  if (pattern === "hireDateThenFixed") {
    firstGrant = hireDate;
    secondGrant = nextFixedDate(hireDate, fixedM, fixedD, false);
    memo += "。初回は入社日、以後は一斉付与日";
  }

  if (pattern === "semiAnnual") {
    firstGrant = getFirstSemiAnnualDate(hireDate);
    secondGrant = nextFixedDate(addYears(firstGrant, 1), Number(secondHalfGrantMonth.value), fixedD);
    memo += "。4月から9月入社は上半期枠、10月から3月入社は下半期枠";
  }

  timelineItems.push({
    date: firstGrant,
    title: "初回付与",
    daysLabel: `${firstLabel}付与`,
    isFixedGrant: (pattern === "fixedWithSixMonthCap" && dateKey(firstGrant) === dateKey(nextFixedDate(hireDate, fixedM, fixedD))) || pattern === "semiAnnual",
    body: `${firstLabel}を付与。出勤率8割以上などの要件確認が必要です`
  });
  timelineItems.push({
    date: secondGrant,
    title: "2回目付与",
    daysLabel: `${secondDays}日付与`,
    isFixedGrant: ["fixedAfterFirst", "fixedWithSixMonthCap", "hireDateThenFixed", "semiAnnual"].includes(pattern),
    body: `${secondDays}日を付与`
  });
  timelineItems.push({
    date: pattern.includes("fixed") || pattern === "semiAnnual" ? nextFixedDate(addYears(secondGrant, 1), fixedM, fixedD) : addYears(secondGrant, 1),
    title: "3回目以降",
    daysLabel: `${getGrantDays(2)}日付与`,
    isFixedGrant: ["fixedAfterFirst", "fixedWithSixMonthCap", "hireDateThenFixed", "semiAnnual"].includes(pattern),
    body: `${getGrantDays(2)}日から勤続年数に応じて増加`
  });

  return { firstGrant, secondGrant, firstLabel, memo, timelineItems };
}

function render() {
  renderPatternCards();

  document.querySelectorAll(".proportional-only").forEach((node) => {
    node.classList.toggle("is-hidden", workType.value !== "proportional");
  });

  document.querySelectorAll(".split-only").forEach((node) => {
    node.classList.toggle("is-hidden", !["splitInitial", "splitThenFixed"].includes(grantPattern.value));
  });

  document.querySelector("#fixedDateFields").classList.toggle(
    "is-hidden",
    ["anniversary", "splitInitial", "hireDate"].includes(grantPattern.value)
  );

  document.querySelector("#fixedSettingsFieldset").classList.toggle(
    "is-hidden",
    !usesFixedGrantDate(grantPattern.value)
  );

  document.querySelector("#semiAnnualFields").classList.toggle("is-hidden", grantPattern.value !== "semiAnnual");
}

function renderResult() {
  const [year, month, day] = hireDate.value.split("-").map(Number);
  const selectedHireDate = makeDate(year, month, day);
  const result = calculateForDate(selectedHireDate);
  personSchedule.innerHTML = renderPersonSchedule(selectedHireDate, result);
  resultPanel.classList.remove("is-hidden");
  printPanel.classList.remove("is-hidden");
  printButton.disabled = false;
}

form.addEventListener("input", render);
form.addEventListener("change", render);
form.addEventListener("input", () => {
  resultPanel.classList.add("is-hidden");
  printPanel.classList.add("is-hidden");
  printButton.disabled = true;
});
form.addEventListener("change", () => {
  resultPanel.classList.add("is-hidden");
  printPanel.classList.add("is-hidden");
  printButton.disabled = true;
});
printPanel.addEventListener("input", () => {
  if (!resultPanel.classList.contains("is-hidden")) renderResult();
});
printPanel.addEventListener("change", () => {
  if (!resultPanel.classList.contains("is-hidden")) renderResult();
});
confirmButton.addEventListener("click", renderResult);
printButton.addEventListener("click", () => {
  if (printButton.disabled) return;
  window.print();
});
patternCards.addEventListener("click", (event) => {
  const card = event.target.closest(".pattern-card");
  if (!card) return;
  grantPattern.value = card.dataset.pattern;
  render();
  resultPanel.classList.add("is-hidden");
  printPanel.classList.add("is-hidden");
  printButton.disabled = true;
});
patternCards.addEventListener("keydown", (event) => {
  if (!["Enter", " "].includes(event.key)) return;
  const card = event.target.closest(".pattern-card");
  if (!card) return;
  event.preventDefault();
  grantPattern.value = card.dataset.pattern;
  render();
  resultPanel.classList.add("is-hidden");
  printPanel.classList.add("is-hidden");
  printButton.disabled = true;
});
render();
