import React, { useState } from 'react';
import { Runner, CustomList, CustomColumn, CustomRow } from '../types';
import { 
  Plus, ClipboardList, Trash2, Check, X, Search, Users, 
  Settings, CheckSquare, Edit, Square, Save, AlertCircle, FileText, UserPlus, Columns
} from 'lucide-react';
import { Language } from '../translations';

interface CustomListsProps {
  runners: Runner[];
  currentUser: Runner;
  lists: CustomList[];
  onSaveList: (list: CustomList) => void;
  onDeleteList: (listId: string) => void;
  language: Language;
}

export default function CustomLists({ 
  runners, 
  currentUser, 
  lists, 
  onSaveList, 
  onDeleteList, 
  language 
}: CustomListsProps) {

  const isRtl = language === 'ar';
  const isAdminOrCoach = currentUser.runClubRole === 'Admin' || currentUser.runClubRole === 'Coach';

  // State
  const [activeListId, setActiveListId] = useState<string | null>(lists.length > 0 ? lists[0].id : null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Create Form State
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [tempColumns, setTempColumns] = useState<CustomColumn[]>([
    { id: 'col-status', name: language === 'ar' ? 'الحالة (تم)' : 'Statut (Cbn)', type: 'boolean' }
  ]);
  const [columnNameInput, setColumnNameInput] = useState<string>('');
  const [columnTypeInput, setColumnTypeInput] = useState<'boolean' | 'text'>('boolean');
  const [selectedRunnerIds, setSelectedRunnerIds] = useState<string[]>(runners.map(r => r.id)); // Default select all

  // Sheet Internal Search
  const [sheetSearch, setSheetSearch] = useState<string>('');

  const activeList = lists.find(l => l.id === activeListId);

  // Translate labels locally
  const t = (key: string) => {
    const labels: Record<string, Record<Language, string>> = {
      title: { ar: 'عنوان القائمة / الغرض منها', fr: 'Titre de la liste / Objet', en: 'List Title / Purpose' },
      titlePlaceholder: { ar: 'مثال: اشتراكات قميص النادي، حضور الاجتماع...', fr: 'Ex: Cotisations T-shirts, Présente AG...', en: 'Ex: T-shirt payment, meeting attendance...' },
      description: { ar: 'الوصف أو الملاحظات العامة', fr: 'Description / Notes générales', en: 'Description / Notes' },
      descriptionPlaceholder: { ar: 'تفاصيل إضافية حول هذه القائمة...', fr: 'Détails additionnels concernant cette liste...', en: 'Additional details about this list...' },
      columns: { ar: 'الأعمدة المخصصة المتاحة', fr: 'Colonnes personnalisées', en: 'Custom Columns' },
      addColumn: { ar: 'إضافة عمود جديد', fr: 'Ajouter une colonne', en: 'Add Column' },
      columnName: { ar: 'اسم العمود', fr: 'Nom de la colonne', en: 'Column Name' },
      columnNamePlaceholder: { ar: 'مثال: الحجم، دافع، ملاحظة', fr: 'Ex: Taille, Versement, Note', en: 'Ex: Size, Paid, Note' },
      columnTypeCheck: { ar: 'علامة تحديد (نعم / لا)', fr: 'Vérification (Oui/Non)', en: 'Checkbox (Yes/No)' },
      columnTypeText: { ar: 'نص حر / تعليق', fr: 'Texte / Commentaire libre', en: 'Free text / Comment' },
      runnersSelect: { ar: 'اختر العدائين المعنيين', fr: 'Sélectionner les athlètes concernés', en: 'Select Athletes' },
      selectAll: { ar: 'تحديد الكل', fr: 'Sélectionner Tout', en: 'Select All' },
      deselectAll: { ar: 'إلغاء التحديد', fr: 'Tout Désélectionner', en: 'Deselect All' },
      createBtn: { ar: 'إنشاء الجدول المخصص', fr: 'Créer le Tableau', en: 'Create Spreadsheet' },
      noLists: { ar: 'لا توجد قوائم مخصصة حالياً. أنشئ قائمتك الأولى وجدولها!', fr: 'Aucune liste personnalisée trouvée. Créez votre premier tableau !', en: 'No custom lists found. Create your first spreadsheet!' },
      searchRunners: { ar: 'البحث عن عداء في هذا الجدول...', fr: 'Rechercher un membre dans ce tableau...', en: 'Search runner in this grid...' },
      confirmDelete: { ar: 'هل أنت متأكد من حذف هذه القائمة بالكامل؟', fr: 'Voulez-vous vraiment supprimer cette liste définitivement ?', en: 'Are you sure you want to delete this list permanently?' }
    };
    return labels[key]?.[language] || labels[key]?.['fr'] || key;
  };

  // Add a custom column definition helper
  const handleAddColumnDef = () => {
    if (!columnNameInput.trim()) return;
    const newCol: CustomColumn = {
      id: `col-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: columnNameInput.trim(),
      type: columnTypeInput
    };
    setTempColumns([...tempColumns, newCol]);
    setColumnNameInput('');
  };

  // Remove a column definition during creation
  const handleRemoveColumnDef = (id: string) => {
    setTempColumns(tempColumns.filter(c => c.id !== id));
  };

  // Save/Create List
  const handleCreateListSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert(language === 'ar' ? 'يرجى كتابة عنوان للقائمة' : 'Veuillez saisir un titre pour la liste');
      return;
    }
    if (selectedRunnerIds.length === 0) {
      alert(language === 'ar' ? 'يرجى تحديد عداء واحد على الأقل' : 'Veuillez sélectionner au moins un athlète');
      return;
    }

    // Build Rows
    const rows: CustomRow[] = selectedRunnerIds.map(runnerId => {
      const runner = runners.find(r => r.id === runnerId);
      const values: { [colId: string]: any } = {};
      
      // Initialize columns with default values
      tempColumns.forEach(col => {
        values[col.id] = col.type === 'boolean' ? false : '';
      });

      return {
        runnerId,
        runnerName: runner ? runner.name : 'Unknown Athlete',
        values
      };
    });

    const newList: CustomList = {
      id: `list-${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim() || undefined,
      createdAt: new Date().toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      columns: tempColumns,
      rows
    };

    onSaveList(newList);
    setIsCreating(false);
    setActiveListId(newList.id);

    // Reset Form
    setNewTitle('');
    setNewDesc('');
    setTempColumns([
      { id: 'col-status', name: language === 'ar' ? 'الحالة (تم)' : 'Statut (Cbn)', type: 'boolean' }
    ]);
    setSelectedRunnerIds(runners.map(r => r.id));
  };

  // Toggle boolean cell value in worksheet
  const handleToggleCell = (list: CustomList, rowIndex: number, columnId: string) => {
    const updatedRows = [...list.rows];
    const currentValue = !!updatedRows[rowIndex].values[columnId];
    updatedRows[rowIndex].values[columnId] = !currentValue;
    
    onSaveList({
      ...list,
      rows: updatedRows
    });
  };

  // Modify text cell value in worksheet
  const handleTextCellChange = (list: CustomList, rowIndex: number, columnId: string, text: string) => {
    const updatedRows = [...list.rows];
    updatedRows[rowIndex].values[columnId] = text;
    
    onSaveList({
      ...list,
      rows: updatedRows
    });
  };

  // Add athlete to an existing list
  const [showAddMemberDropdown, setShowAddMemberDropdown] = useState(false);
  const handleAddAthleteToList = (list: CustomList, runnerId: string) => {
    if (list.rows.some(r => r.runnerId === runnerId)) return;
    const runner = runners.find(r => r.id === runnerId);
    if (!runner) return;

    const values: { [colId: string]: any } = {};
    list.columns.forEach(col => {
      values[col.id] = col.type === 'boolean' ? false : '';
    });

    const newRow: CustomRow = {
      runnerId: runner.id,
      runnerName: runner.name,
      values
    };

    onSaveList({
      ...list,
      rows: [...list.rows, newRow]
    });
    setShowAddMemberDropdown(false);
  };

  // Remove athlete row from list
  const handleRemoveRowFromList = (list: CustomList, runnerId: string) => {
    onSaveList({
      ...list,
      rows: list.rows.filter(r => r.runnerId !== runnerId)
    });
  };

  return (
    <div className={`space-y-6 ${isRtl ? 'font-arabic' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* Tab Info Banner */}
      <div className="bg-gradient-to-r from-natural-olive to-natural-sage/90 text-white rounded-[2rem] p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-natural-accent/20 rounded-full blur-2xl" />
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-natural-accent" />
            <h2 className="text-2xl sm:text-3xl font-serif italic font-black">
              {language === 'ar' ? 'فضاء الجداول والقوائم المخصصة' : 'Tableaux et Listes Internes du Club'}
            </h2>
          </div>
          <p className="text-sm text-white/90 max-w-3xl leading-relaxed">
            {language === 'ar' 
              ? 'قم بإنشاء جداول مخصصة للتحكم في أي موضوع: تتبع الاشتراكات، الحضور، مقاسات الألبسة أو تصفية الأعضاء بشكل يدوي مع إمكانية إضافة خانات اختيار أو كتابة نصوص.' 
              : 'Générez des fiches de contrôle pour n\'importe quel besoin : cotisations, présences, tailles de vêtements ou suivi libre. Définissez vos propres lignes et colonnes, et cochez les athlètes directement.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Sidebar list of all sheets */}
        <div className="lg:col-span-4 bg-white border border-natural-border rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-natural-olive tracking-wider flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              {language === 'ar' ? 'القوائم النشطة' : 'Listes Actives'}
            </h3>
            {isAdminOrCoach && (
              <button
                onClick={() => {
                  setIsCreating(!isCreating);
                  setActiveListId(null);
                }}
                className="flex items-center gap-1.5 bg-natural-accent hover:opacity-95 text-natural-olive font-bold text-xs py-2 px-3.5 rounded-xl transition cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'إنشاء' : 'Créer'}</span>
              </button>
            )}
          </div>

          {/* Search List */}
          <div className="relative">
            <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-2.5 w-4 h-4 text-natural-sage`} />
            <input
              type="text"
              placeholder={language === 'ar' ? 'ابحث عن جدول...' : 'Rechercher un tableau...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full text-xs ${isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2 bg-natural-bone/50 border border-natural-border rounded-xl focus:outline-none focus:ring-1 focus:ring-natural-olive font-semibold transition-all`}
            />
          </div>

          <div className="divide-y divide-natural-divider max-h-[350px] overflow-y-auto pr-1">
            {lists
              .filter(l => l.title.toLowerCase().includes(searchQuery.toLowerCase()) || (l.description && l.description.toLowerCase().includes(searchQuery.toLowerCase())))
              .map(list => {
                const totalRows = list.rows.length;
                // Calculate average checked booleans for progress
                const boolCols = list.columns.filter(c => c.type === 'boolean');
                let checkedCount = 0;
                let totalBoolCells = boolCols.length * list.rows.length;
                
                list.rows.forEach(r => {
                  boolCols.forEach(col => {
                    if (r.values[col.id] === true) checkedCount++;
                  });
                });

                const checkedPercentage = totalBoolCells > 0 ? Math.round((checkedCount / totalBoolCells) * 100) : 0;

                return (
                  <button
                    key={list.id}
                    onClick={() => {
                      setIsCreating(false);
                      setActiveListId(list.id);
                    }}
                    className={`w-full text-right ${isRtl ? 'text-right' : 'text-left'} p-3.5 rounded-2xl flex flex-col gap-1 transition-all ${
                      activeListId === list.id 
                        ? 'bg-natural-sage-light/60 border border-natural-border' 
                        : 'hover:bg-natural-bone/40'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-serif italic font-bold text-natural-olive text-sm truncate max-w-[200px]">
                        {list.title}
                      </span>
                      <span className="text-[9px] font-mono text-natural-sage font-bold bg-white px-2 py-0.5 rounded-md border border-natural-border/50">
                        {list.createdAt}
                      </span>
                    </div>
                    {list.description && (
                      <p className="text-[11px] text-natural-sage truncate w-full">
                        {list.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-[10px] text-natural-sage mt-1">
                      <span className="flex items-center gap-1 font-semibold">
                        <Users className="w-3 h-3" />
                        {totalRows} {language === 'ar' ? 'عداء' : 'athlètes'}
                      </span>
                      {totalBoolCells > 0 && (
                        <span className="font-mono bg-natural-olive/10 text-natural-olive font-bold px-1.5 py-0.5 rounded">
                          {checkedPercentage}% OK ({checkedCount}/{totalBoolCells})
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}

            {lists.length === 0 && (
              <div className="text-center py-8 text-natural-sage">
                <ClipboardList className="w-8 h-8 mx-auto opacity-40 mb-2" />
                <p className="text-xs font-semibold">{t('noLists')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Active Workspace / Creation Sheet */}
        <div className="lg:col-span-8 space-y-6">

          {/* Creation Form Form */}
          {isCreating && isAdminOrCoach ? (
            <form onSubmit={handleCreateListSubmit} className="bg-white border border-natural-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs animate-fade-in">
              <div className="border-b border-natural-divider pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-serif italic font-black text-natural-olive">
                    {language === 'ar' ? 'إنشاء جدول مخصص جديد' : 'Nouveau Tableau de Contrôle Personnalisé'}
                  </h3>
                  <p className="text-xs text-natural-sage mt-0.5">
                    {language === 'ar' ? 'صمم أعمدة الجدول واختر العدائين المعنيين بالعملية.' : 'Saisissez les paramètres de votre nouvelle fiche de suivi personnalisé.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="p-1.5 hover:bg-natural-bone rounded-xl text-natural-sage transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Title & Desc */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-natural-olive uppercase tracking-wider block">
                    {t('title')} <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t('titlePlaceholder')}
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full text-xs p-3 bg-natural-bone/40 border border-natural-border rounded-2xl focus:outline-none focus:ring-1 focus:ring-natural-olive font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-natural-olive uppercase tracking-wider block">
                    {t('description')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('descriptionPlaceholder')}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full text-xs p-3 bg-natural-bone/40 border border-natural-border rounded-2xl focus:outline-none focus:ring-1 focus:ring-natural-olive font-semibold"
                  />
                </div>
              </div>

              {/* Columns management */}
              <div className="bg-natural-bone/30 p-5 rounded-[1.8rem] border border-natural-border/60 space-y-4">
                <div className="flex items-center gap-2">
                  <Columns className="w-4 h-4 text-natural-olive" />
                  <span className="text-xs font-bold text-natural-olive uppercase tracking-wider">
                    {t('columns')}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 min-h-[40px] p-2.5 bg-white rounded-2xl border border-natural-border/40">
                  {tempColumns.map((col, idx) => (
                    <div 
                      key={col.id} 
                      className="flex items-center gap-1.5 bg-natural-sage-light text-natural-olive px-3 py-1.5 rounded-xl text-xs font-bold"
                    >
                      <span>{col.name}</span>
                      <span className="text-[9px] opacity-75 bg-white/70 px-1 py-0.5 rounded font-mono">
                        {col.type === 'boolean' ? 'checkbox' : 'text'}
                      </span>
                      {col.id !== 'col-status' && (
                        <button
                          type="button"
                          onClick={() => handleRemoveColumnDef(col.id)}
                          className="text-red-700 hover:text-red-950 p-0.5 rounded-full"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add column sub-form */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-white/60 p-3 rounded-2xl border border-natural-border/30">
                  <div className="sm:col-span-5 space-y-1">
                    <span className="text-[10px] font-bold text-natural-sage block">{t('columnName')}</span>
                    <input
                      type="text"
                      placeholder={t('columnNamePlaceholder')}
                      value={columnNameInput}
                      onChange={(e) => setColumnNameInput(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-natural-border rounded-xl focus:outline-none focus:ring-1 focus:ring-natural-olive font-semibold"
                    />
                  </div>
                  <div className="sm:col-span-4 space-y-1">
                    <span className="text-[10px] font-bold text-natural-sage block">{language === 'ar' ? 'نوع المعطيات' : 'Type de donnée'}</span>
                    <select
                      value={columnTypeInput}
                      onChange={(e) => setColumnTypeInput(e.target.value as 'boolean' | 'text')}
                      className="w-full text-xs p-2 bg-white border border-natural-border rounded-xl focus:outline-none focus:ring-1 focus:ring-natural-olive font-bold text-natural-olive"
                    >
                      <option value="boolean">{t('columnTypeCheck')}</option>
                      <option value="text">{t('columnTypeText')}</option>
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <button
                      type="button"
                      onClick={handleAddColumnDef}
                      className="w-full bg-natural-olive hover:opacity-95 text-white font-bold text-xs py-2 px-3 rounded-xl transition cursor-pointer"
                    >
                      {t('addColumn')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Athletes Selector Checklist */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-natural-olive uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    <span>{t('runnersSelect')} <span className="text-natural-sage">({selectedRunnerIds.length}/{runners.length})</span></span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRunnerIds(runners.map(r => r.id))}
                      className="text-[10px] bg-natural-bone hover:bg-natural-border/60 text-natural-olive px-2.5 py-1 rounded-lg font-bold transition cursor-pointer"
                    >
                      {t('selectAll')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRunnerIds([])}
                      className="text-[10px] bg-natural-bone hover:bg-natural-border/60 text-red-700 px-2.5 py-1 rounded-lg font-bold transition cursor-pointer"
                    >
                      {t('deselectAll')}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-3.5 bg-natural-bone/20 border border-natural-border/60 rounded-[1.8rem] max-h-[160px] overflow-y-auto">
                  {runners.map(runner => (
                    <label 
                      key={runner.id} 
                      className={`flex items-center gap-2 p-2 rounded-xl text-xs hover:bg-white select-none transition-colors border border-transparent hover:border-natural-border/30 cursor-pointer ${
                        selectedRunnerIds.includes(runner.id) ? 'bg-white font-bold text-natural-olive' : 'text-natural-sage'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedRunnerIds.includes(runner.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRunnerIds([...selectedRunnerIds, runner.id]);
                          } else {
                            setSelectedRunnerIds(selectedRunnerIds.filter(id => id !== runner.id));
                          }
                        }}
                        className="rounded border-natural-border text-natural-olive focus:ring-natural-olive/30 w-3.5 h-3.5"
                      />
                      <span className="truncate">{runner.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Footer Forms */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-natural-divider">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="bg-natural-bone hover:bg-natural-border/50 text-natural-olive font-bold text-xs py-2.5 px-5 rounded-2xl transition cursor-pointer"
                >
                  {language === 'ar' ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  className="bg-natural-olive hover:opacity-95 text-white font-serif italic font-black text-xs py-2.5 px-6 rounded-2xl shadow-sm transition cursor-pointer"
                >
                  {t('createBtn')}
                </button>
              </div>
            </form>
          ) : activeList ? (
            /* Active sheet Workspace */
            <div className="bg-white border border-natural-border rounded-3xl p-5 sm:p-6 shadow-xs space-y-6">
              
              {/* Sheet header controls */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-natural-divider pb-5">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-serif italic font-black text-natural-olive">
                      {activeList.title}
                    </h3>
                    <span className="text-[10px] font-mono text-natural-sage font-bold bg-natural-bone p-1 px-2 rounded-lg border border-natural-border/40">
                      {activeList.createdAt}
                    </span>
                  </div>
                  {activeList.description && (
                    <p className="text-xs text-natural-sage leading-relaxed bg-natural-bone/40 p-2.5 px-3.5 rounded-xl border border-natural-border/40">
                      {activeList.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {/* Join Members/Add Row button */}
                  {isAdminOrCoach && (
                    <div className="relative">
                      <button
                        onClick={() => setShowAddMemberDropdown(!showAddMemberDropdown)}
                        className="flex items-center gap-1.5 bg-natural-bone hover:bg-natural-border/40 text-natural-olive font-bold text-xs py-2 px-3.5 rounded-xl transition cursor-pointer border border-natural-border/60"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>{language === 'ar' ? 'أضف عداء' : 'Ajouter athlète'}</span>
                      </button>

                      {showAddMemberDropdown && (
                        <div className={`absolute ${isRtl ? 'left-0' : 'right-0'} mt-2 w-56 bg-white border border-natural-border rounded-2xl shadow-xl z-50 max-h-[220px] overflow-y-auto p-2`}>
                          <div className="text-[10px] font-bold text-natural-sage p-1 border-b border-natural-divider mb-1.5">
                            {language === 'ar' ? 'اختر للضم إلى الجدول' : 'Sélectionner pour ajouter'}
                          </div>
                          {runners
                            .filter(r => !activeList.rows.some(row => row.runnerId === r.id))
                            .map(r => (
                              <button
                                key={r.id}
                                onClick={() => handleAddAthleteToList(activeList, r.id)}
                                className="w-full text-right hover:bg-natural-bone/60 p-2 rounded-xl text-xs font-semibold text-natural-olive"
                              >
                                {r.name}
                              </button>
                            ))}
                          {runners.filter(r => !activeList.rows.some(row => row.runnerId === r.id)).length === 0 && (
                            <div className="text-center py-3 text-[11px] text-natural-sage font-medium">
                              {language === 'ar' ? 'جميع عدائي النادي مضافون حالياً' : 'Tous les membres sont déjà inscrits'}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Delete complete sheet button */}
                  {isAdminOrCoach && (
                    <button
                      onClick={() => {
                        if (confirm(t('confirmDelete'))) {
                          onDeleteList(activeList.id);
                          setActiveListId(lists.length > 1 ? lists.filter(l => l.id !== activeList.id)[0].id : null);
                        }
                      }}
                      className="p-2 hover:bg-red-50 hover:text-red-700 bg-red-50/20 text-red-600 rounded-xl border border-red-200/50 transition cursor-pointer"
                      title={language === 'ar' ? 'حذف هذا الجدول بالكامل' : 'Supprimer définitivement cette liste'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filter grid search */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-natural-bone/10 p-2 rounded-2xl border border-natural-border/60">
                <div className="relative w-full sm:max-w-xs">
                  <Search className={`absolute ${isRtl ? 'right-2.5' : 'left-2.5'} top-2 w-3.5 h-3.5 text-natural-sage`} />
                  <input
                    type="text"
                    placeholder={t('searchRunners')}
                    value={sheetSearch}
                    onChange={(e) => setSheetSearch(e.target.value)}
                    className={`w-full text-xs ${isRtl ? 'pr-8 pl-3' : 'pl-8 pr-3'} py-1.5 bg-white border border-natural-border rounded-xl focus:outline-none focus:ring-1 focus:ring-natural-olive font-semibold transition-all`}
                  />
                </div>

                <div className="text-[11px] text-natural-sage font-bold font-mono">
                  {language === 'ar' ? 'مجموع الصفوف:' : 'Total lignes :'} <span className="text-natural-olive font-serif italic text-sm">{activeList.rows.length}</span>
                </div>
              </div>

              {/* Actual spreadsheet grid table */}
              <div className="overflow-x-auto rounded-2xl border border-natural-border/80">
                <table className={`w-full text-left text-[11px] border-collapse min-w-[500px] ${isRtl ? 'text-right' : ''}`}>
                  <thead>
                    <tr className="bg-natural-bone text-natural-olive font-bold uppercase tracking-wider border-b border-natural-border/80">
                      <th className="p-3 text-xs w-[180px]">{language === 'ar' ? 'العداء' : 'Athlète'}</th>
                      {activeList.columns.map(col => (
                        <th key={col.id} className="p-3 text-xs">
                          <div className="flex items-center gap-1">
                            <span>{col.name}</span>
                          </div>
                        </th>
                      ))}
                      {isAdminOrCoach && (
                        <th className="p-3 w-10 text-center"></th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-natural-divider">
                    {activeList.rows
                      .filter(row => !sheetSearch || row.runnerName.toLowerCase().includes(sheetSearch.toLowerCase()))
                      .map((row, rowIndex) => (
                        <tr 
                          key={row.runnerId}
                          className="hover:bg-natural-bone/20 transition-colors"
                        >
                          <td className="p-3 font-semibold text-natural-text">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-natural-sage/20 text-natural-olive flex items-center justify-center text-[10px] font-bold shrink-0">
                                {row.runnerName?.charAt(0) || 'R'}
                              </span>
                              <span className="truncate max-w-[130px]" title={row.runnerName}>{row.runnerName}</span>
                            </div>
                          </td>

                          {activeList.columns.map(col => {
                            const val = row.values[col.id];
                            return (
                              <td key={col.id} className="p-3">
                                {col.type === 'boolean' ? (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleCell(activeList, rowIndex, col.id)}
                                    className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                                      val ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                                    }`}
                                  >
                                    <span className="bg-white w-4 h-4 rounded-full shadow-md transform duration-200" />
                                  </button>
                                ) : (
                                  <input
                                    type="text"
                                    value={val || ''}
                                    onChange={(e) => handleTextCellChange(activeList, rowIndex, col.id, e.target.value)}
                                    placeholder="..."
                                    className="w-full text-[11px] p-2 bg-transparent hover:bg-natural-bone/40 focus:bg-white border-b border-transparent focus:border-natural-olive focus:outline-none transition font-semibold"
                                  />
                                )}
                              </td>
                            );
                          })}

                          {isAdminOrCoach && (
                            <td className="p-3 text-center">
                              <button
                                onClick={() => handleRemoveRowFromList(activeList, row.runnerId)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition"
                                title={language === 'ar' ? 'إزالة من هذا الجدول' : 'Retirer de la liste'}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}

                    {activeList.rows.length === 0 && (
                      <tr>
                        <td colSpan={1 + activeList.columns.length + (isAdminOrCoach ? 1 : 0)} className="p-8 text-center text-natural-sage font-semibold">
                          <Users className="w-8 h-8 mx-auto opacity-30 mb-2" />
                          {language === 'ar' ? 'لا يوجد عدائين في هذا الجدول حالياً. أضف عدائين من زر إضافة عداء.' : 'Aucun adepte inscrit pour le moment.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Informative advice message */}
              <div className="flex items-start gap-2 bg-natural-sage-light/30 border border-natural-border p-3 px-4 rounded-2xl">
                <AlertCircle className="w-4 h-4 text-natural-olive shrink-0 mt-0.5" />
                <p className="text-[10px] text-natural-olive leading-normal font-semibold">
                  {language === 'ar' 
                    ? '💡 جميع التعديلات داخل هذا الجدول تُحفظ في الذاكرة المحلية (localStorage) وتتم مزامنتها تلقائياً. لإنشاء جدول آخر جديد، اضغط على زر "إنشاء" في اليسار.'
                    : '💡 Les modifications sur les cellules de ce tableau sont enregistrées instantanément. Vous pouvez ajouter autant d\'athlètes et d\'informations que souhaité.'}
                </p>
              </div>

            </div>
          ) : (
            /* Empty state selection alert */
            <div className="bg-white border border-natural-border rounded-3xl p-12 text-center text-natural-sage flex flex-col items-center justify-center space-y-4">
              <ClipboardList className="w-12 h-12 stroke-[1.5] text-natural-sage opacity-50" />
              <div>
                <h4 className="font-serif italic font-bold text-natural-olive text-lg">
                  {language === 'ar' ? 'لا توجد قائمة مفعلة معروضة' : 'Aucun tableau affiché'}
                </h4>
                <p className="text-xs text-natural-sage max-w-sm mx-auto mt-1">
                  {language === 'ar' 
                    ? 'اختر أحد الجداول من القائمة الجانبية أو اضغط على زر "إنشاء" لتصميم جدول تتبع مخصص جديد.'
                    : 'Sélectionnez l\'une de vos listes dans le menu de gauche ou créez un tout nouveau tableau de bord.'}
                </p>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
