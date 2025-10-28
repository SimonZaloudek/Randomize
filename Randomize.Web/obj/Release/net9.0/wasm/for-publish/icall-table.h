#define ICALL_TABLE_corlib 1

static int corlib_icall_indexes [] = {
246,
259,
260,
261,
262,
263,
264,
265,
266,
267,
270,
271,
272,
450,
451,
452,
480,
481,
482,
509,
510,
511,
609,
610,
611,
612,
613,
616,
658,
659,
660,
661,
665,
667,
669,
671,
676,
684,
685,
686,
687,
688,
689,
690,
691,
692,
693,
694,
695,
696,
697,
698,
699,
700,
702,
703,
704,
705,
706,
707,
708,
795,
796,
797,
798,
799,
800,
801,
802,
803,
804,
805,
806,
807,
808,
809,
810,
811,
813,
814,
815,
816,
817,
818,
819,
881,
890,
891,
961,
967,
970,
972,
977,
978,
980,
981,
985,
987,
988,
990,
991,
994,
995,
996,
999,
1001,
1004,
1006,
1008,
1017,
1084,
1086,
1088,
1098,
1099,
1100,
1102,
1108,
1109,
1110,
1111,
1112,
1120,
1121,
1122,
1126,
1127,
1129,
1133,
1134,
1135,
1427,
1619,
1620,
9388,
9389,
9391,
9392,
9393,
9394,
9395,
9397,
9398,
9399,
9400,
9401,
9418,
9420,
9425,
9427,
9429,
9431,
9483,
9484,
9486,
9487,
9488,
9489,
9490,
9492,
9494,
10617,
10621,
10623,
10624,
10625,
10626,
11058,
11059,
11060,
11061,
11079,
11080,
11081,
11083,
11131,
11217,
11220,
11229,
11230,
11231,
11232,
11233,
11234,
11588,
11589,
11594,
11595,
11631,
11668,
11675,
11682,
11693,
11696,
11721,
11806,
11808,
11820,
11822,
11823,
11824,
11825,
11832,
11847,
11867,
11868,
11876,
11878,
11885,
11886,
11889,
11891,
11896,
11902,
11903,
11910,
11912,
11924,
11927,
11928,
11929,
11940,
11950,
11956,
11957,
11958,
11960,
11961,
11978,
11980,
11995,
12015,
12016,
12041,
12046,
12076,
12077,
12658,
12748,
12749,
12970,
12971,
12979,
12980,
12981,
12987,
13054,
13738,
13739,
14337,
14342,
14352,
15386,
15407,
15409,
15411,
};
void ves_icall_System_Array_InternalCreate (int,int,int,int,int);
int ves_icall_System_Array_GetCorElementTypeOfElementTypeInternal (int);
int ves_icall_System_Array_IsValueOfElementTypeInternal (int,int);
int ves_icall_System_Array_CanChangePrimitive (int,int,int);
int ves_icall_System_Array_FastCopy (int,int,int,int,int);
int ves_icall_System_Array_GetLengthInternal_raw (int,int,int);
int ves_icall_System_Array_GetLowerBoundInternal_raw (int,int,int);
void ves_icall_System_Array_GetGenericValue_icall (int,int,int);
void ves_icall_System_Array_GetValueImpl_raw (int,int,int,int);
void ves_icall_System_Array_SetGenericValue_icall (int,int,int);
void ves_icall_System_Array_SetValueImpl_raw (int,int,int,int);
void ves_icall_System_Array_InitializeInternal_raw (int,int);
void ves_icall_System_Array_SetValueRelaxedImpl_raw (int,int,int,int);
void ves_icall_System_Runtime_RuntimeImports_ZeroMemory (int,int);
void ves_icall_System_Runtime_RuntimeImports_Memmove (int,int,int);
void ves_icall_System_Buffer_BulkMoveWithWriteBarrier (int,int,int,int);
int ves_icall_System_Delegate_AllocDelegateLike_internal_raw (int,int);
int ves_icall_System_Delegate_CreateDelegate_internal_raw (int,int,int,int,int);
int ves_icall_System_Delegate_GetVirtualMethod_internal_raw (int,int);
void ves_icall_System_Enum_GetEnumValuesAndNames_raw (int,int,int,int);
int ves_icall_System_Enum_InternalGetCorElementType (int);
void ves_icall_System_Enum_InternalGetUnderlyingType_raw (int,int,int);
int ves_icall_System_Environment_get_ProcessorCount ();
int ves_icall_System_Environment_get_TickCount ();
int64_t ves_icall_System_Environment_get_TickCount64 ();
void ves_icall_System_Environment_Exit (int);
int ves_icall_System_Environment_GetCommandLineArgs_raw (int);
void ves_icall_System_Environment_FailFast_raw (int,int,int,int);
int ves_icall_System_GC_GetMaxGeneration ();
void ves_icall_System_GC_InternalCollect (int);
void ves_icall_System_GC_register_ephemeron_array_raw (int,int);
int ves_icall_System_GC_get_ephemeron_tombstone_raw (int);
void ves_icall_System_GC_SuppressFinalize_raw (int,int);
void ves_icall_System_GC_ReRegisterForFinalize_raw (int,int);
void ves_icall_System_GC_GetGCMemoryInfo (int,int,int,int,int,int);
int ves_icall_System_GC_AllocPinnedArray_raw (int,int,int);
int ves_icall_System_Object_MemberwiseClone_raw (int,int);
double ves_icall_System_Math_Acos (double);
double ves_icall_System_Math_Acosh (double);
double ves_icall_System_Math_Asin (double);
double ves_icall_System_Math_Asinh (double);
double ves_icall_System_Math_Atan (double);
double ves_icall_System_Math_Atan2 (double,double);
double ves_icall_System_Math_Atanh (double);
double ves_icall_System_Math_Cbrt (double);
double ves_icall_System_Math_Ceiling (double);
double ves_icall_System_Math_Cos (double);
double ves_icall_System_Math_Cosh (double);
double ves_icall_System_Math_Exp (double);
double ves_icall_System_Math_Floor (double);
double ves_icall_System_Math_Log (double);
double ves_icall_System_Math_Log10 (double);
double ves_icall_System_Math_Pow (double,double);
double ves_icall_System_Math_Sin (double);
double ves_icall_System_Math_Sinh (double);
double ves_icall_System_Math_Sqrt (double);
double ves_icall_System_Math_Tan (double);
double ves_icall_System_Math_Tanh (double);
double ves_icall_System_Math_FusedMultiplyAdd (double,double,double);
double ves_icall_System_Math_Log2 (double);
double ves_icall_System_Math_ModF (double,int);
float ves_icall_System_MathF_Acos (float);
float ves_icall_System_MathF_Acosh (float);
float ves_icall_System_MathF_Asin (float);
float ves_icall_System_MathF_Asinh (float);
float ves_icall_System_MathF_Atan (float);
float ves_icall_System_MathF_Atan2 (float,float);
float ves_icall_System_MathF_Atanh (float);
float ves_icall_System_MathF_Cbrt (float);
float ves_icall_System_MathF_Ceiling (float);
float ves_icall_System_MathF_Cos (float);
float ves_icall_System_MathF_Cosh (float);
float ves_icall_System_MathF_Exp (float);
float ves_icall_System_MathF_Floor (float);
float ves_icall_System_MathF_Log (float);
float ves_icall_System_MathF_Log10 (float);
float ves_icall_System_MathF_Pow (float,float);
float ves_icall_System_MathF_Sin (float);
float ves_icall_System_MathF_Sinh (float);
float ves_icall_System_MathF_Sqrt (float);
float ves_icall_System_MathF_Tan (float);
float ves_icall_System_MathF_Tanh (float);
float ves_icall_System_MathF_FusedMultiplyAdd (float,float,float);
float ves_icall_System_MathF_Log2 (float);
float ves_icall_System_MathF_ModF (float,int);
int ves_icall_RuntimeMethodHandle_GetFunctionPointer_raw (int,int);
void ves_icall_RuntimeMethodHandle_ReboxFromNullable_raw (int,int,int);
void ves_icall_RuntimeMethodHandle_ReboxToNullable_raw (int,int,int,int);
int ves_icall_RuntimeType_GetCorrespondingInflatedMethod_raw (int,int,int);
void ves_icall_RuntimeType_make_array_type_raw (int,int,int,int);
void ves_icall_RuntimeType_make_byref_type_raw (int,int,int);
void ves_icall_RuntimeType_make_pointer_type_raw (int,int,int);
void ves_icall_RuntimeType_MakeGenericType_raw (int,int,int,int);
int ves_icall_RuntimeType_GetMethodsByName_native_raw (int,int,int,int,int);
int ves_icall_RuntimeType_GetPropertiesByName_native_raw (int,int,int,int,int);
int ves_icall_RuntimeType_GetConstructors_native_raw (int,int,int);
void ves_icall_RuntimeType_GetInterfaceMapData_raw (int,int,int,int,int);
int ves_icall_System_RuntimeType_CreateInstanceInternal_raw (int,int);
void ves_icall_RuntimeType_GetDeclaringMethod_raw (int,int,int);
void ves_icall_System_RuntimeType_getFullName_raw (int,int,int,int,int);
void ves_icall_RuntimeType_GetGenericArgumentsInternal_raw (int,int,int,int);
int ves_icall_RuntimeType_GetGenericParameterPosition (int);
int ves_icall_RuntimeType_GetEvents_native_raw (int,int,int,int);
int ves_icall_RuntimeType_GetFields_native_raw (int,int,int,int,int);
void ves_icall_RuntimeType_GetInterfaces_raw (int,int,int);
int ves_icall_RuntimeType_GetNestedTypes_native_raw (int,int,int,int,int);
void ves_icall_RuntimeType_GetDeclaringType_raw (int,int,int);
void ves_icall_RuntimeType_GetName_raw (int,int,int);
void ves_icall_RuntimeType_GetNamespace_raw (int,int,int);
int ves_icall_RuntimeType_FunctionPointerReturnAndParameterTypes_raw (int,int);
int ves_icall_RuntimeTypeHandle_GetAttributes (int);
int ves_icall_RuntimeTypeHandle_GetMetadataToken_raw (int,int);
void ves_icall_RuntimeTypeHandle_GetGenericTypeDefinition_impl_raw (int,int,int);
int ves_icall_RuntimeTypeHandle_GetCorElementType (int);
int ves_icall_RuntimeTypeHandle_HasInstantiation (int);
int ves_icall_RuntimeTypeHandle_IsInstanceOfType_raw (int,int,int);
int ves_icall_RuntimeTypeHandle_HasReferences_raw (int,int);
int ves_icall_RuntimeTypeHandle_GetArrayRank_raw (int,int);
void ves_icall_RuntimeTypeHandle_GetAssembly_raw (int,int,int);
void ves_icall_RuntimeTypeHandle_GetElementType_raw (int,int,int);
void ves_icall_RuntimeTypeHandle_GetModule_raw (int,int,int);
void ves_icall_RuntimeTypeHandle_GetBaseType_raw (int,int,int);
int ves_icall_RuntimeTypeHandle_type_is_assignable_from_raw (int,int,int);
int ves_icall_RuntimeTypeHandle_IsGenericTypeDefinition (int);
int ves_icall_RuntimeTypeHandle_GetGenericParameterInfo_raw (int,int);
int ves_icall_RuntimeTypeHandle_is_subclass_of_raw (int,int,int);
int ves_icall_RuntimeTypeHandle_IsByRefLike_raw (int,int);
void ves_icall_System_RuntimeTypeHandle_internal_from_name_raw (int,int,int,int,int,int);
int ves_icall_System_String_FastAllocateString_raw (int,int);
int ves_icall_System_String_InternalIsInterned_raw (int,int);
int ves_icall_System_String_InternalIntern_raw (int,int);
int ves_icall_System_Type_internal_from_handle_raw (int,int);
int ves_icall_System_ValueType_InternalGetHashCode_raw (int,int,int);
int ves_icall_System_ValueType_Equals_raw (int,int,int,int);
int ves_icall_System_Threading_Interlocked_CompareExchange_Int (int,int,int);
void ves_icall_System_Threading_Interlocked_CompareExchange_Object (int,int,int,int);
int ves_icall_System_Threading_Interlocked_Decrement_Int (int);
int ves_icall_System_Threading_Interlocked_Increment_Int (int);
int64_t ves_icall_System_Threading_Interlocked_Increment_Long (int);
int ves_icall_System_Threading_Interlocked_Exchange_Int (int,int);
void ves_icall_System_Threading_Interlocked_Exchange_Object (int,int,int);
int64_t ves_icall_System_Threading_Interlocked_CompareExchange_Long (int,int64_t,int64_t);
int64_t ves_icall_System_Threading_Interlocked_Exchange_Long (int,int64_t);
int64_t ves_icall_System_Threading_Interlocked_Read_Long (int);
int ves_icall_System_Threading_Interlocked_Add_Int (int,int);
int64_t ves_icall_System_Threading_Interlocked_Add_Long (int,int64_t);
void ves_icall_System_Threading_Monitor_Monitor_Enter_raw (int,int);
void mono_monitor_exit_icall_raw (int,int);
void ves_icall_System_Threading_Monitor_Monitor_pulse_raw (int,int);
void ves_icall_System_Threading_Monitor_Monitor_pulse_all_raw (int,int);
int ves_icall_System_Threading_Monitor_Monitor_wait_raw (int,int,int,int);
void ves_icall_System_Threading_Monitor_Monitor_try_enter_with_atomic_var_raw (int,int,int,int,int);
void ves_icall_System_Threading_Thread_InitInternal_raw (int,int);
int ves_icall_System_Threading_Thread_GetCurrentThread ();
void ves_icall_System_Threading_InternalThread_Thread_free_internal_raw (int,int);
int ves_icall_System_Threading_Thread_GetState_raw (int,int);
void ves_icall_System_Threading_Thread_SetState_raw (int,int,int);
void ves_icall_System_Threading_Thread_ClrState_raw (int,int,int);
void ves_icall_System_Threading_Thread_SetName_icall_raw (int,int,int,int);
int ves_icall_System_Threading_Thread_YieldInternal ();
void ves_icall_System_Threading_Thread_SetPriority_raw (int,int,int);
void ves_icall_System_Runtime_Loader_AssemblyLoadContext_PrepareForAssemblyLoadContextRelease_raw (int,int,int);
int ves_icall_System_Runtime_Loader_AssemblyLoadContext_GetLoadContextForAssembly_raw (int,int);
int ves_icall_System_Runtime_Loader_AssemblyLoadContext_InternalLoadFile_raw (int,int,int,int);
int ves_icall_System_Runtime_Loader_AssemblyLoadContext_InternalInitializeNativeALC_raw (int,int,int,int,int);
int ves_icall_System_Runtime_Loader_AssemblyLoadContext_InternalLoadFromStream_raw (int,int,int,int,int,int);
int ves_icall_System_Runtime_Loader_AssemblyLoadContext_InternalGetLoadedAssemblies_raw (int);
int ves_icall_System_GCHandle_InternalAlloc_raw (int,int,int);
void ves_icall_System_GCHandle_InternalFree_raw (int,int);
int ves_icall_System_GCHandle_InternalGet_raw (int,int);
void ves_icall_System_GCHandle_InternalSet_raw (int,int,int);
int ves_icall_System_Runtime_InteropServices_Marshal_GetLastPInvokeError ();
void ves_icall_System_Runtime_InteropServices_Marshal_SetLastPInvokeError (int);
void ves_icall_System_Runtime_InteropServices_Marshal_StructureToPtr_raw (int,int,int,int);
int ves_icall_System_Runtime_InteropServices_Marshal_SizeOfHelper_raw (int,int,int);
int ves_icall_System_Runtime_InteropServices_NativeLibrary_LoadByName_raw (int,int,int,int,int,int);
int ves_icall_System_Runtime_CompilerServices_RuntimeHelpers_InternalGetHashCode_raw (int,int);
int ves_icall_System_Runtime_CompilerServices_RuntimeHelpers_GetObjectValue_raw (int,int);
int ves_icall_System_Runtime_CompilerServices_RuntimeHelpers_GetUninitializedObjectInternal_raw (int,int);
void ves_icall_System_Runtime_CompilerServices_RuntimeHelpers_InitializeArray_raw (int,int,int);
int ves_icall_System_Runtime_CompilerServices_RuntimeHelpers_GetSpanDataFrom_raw (int,int,int,int);
void ves_icall_System_Runtime_CompilerServices_RuntimeHelpers_RunClassConstructor_raw (int,int);
int ves_icall_System_Runtime_CompilerServices_RuntimeHelpers_SufficientExecutionStack ();
int ves_icall_System_Runtime_CompilerServices_RuntimeHelpers_InternalBox_raw (int,int,int);
int ves_icall_System_Reflection_Assembly_GetExecutingAssembly_raw (int,int);
int ves_icall_System_Reflection_Assembly_GetEntryAssembly_raw (int);
int ves_icall_System_Reflection_Assembly_InternalLoad_raw (int,int,int,int);
int ves_icall_System_Reflection_Assembly_InternalGetType_raw (int,int,int,int,int,int);
int ves_icall_System_Reflection_AssemblyName_GetNativeName (int);
int ves_icall_MonoCustomAttrs_GetCustomAttributesInternal_raw (int,int,int,int);
int ves_icall_MonoCustomAttrs_GetCustomAttributesDataInternal_raw (int,int);
int ves_icall_MonoCustomAttrs_IsDefinedInternal_raw (int,int,int);
int ves_icall_System_Reflection_FieldInfo_internal_from_handle_type_raw (int,int,int);
int ves_icall_System_Reflection_FieldInfo_get_marshal_info_raw (int,int);
int ves_icall_System_Reflection_LoaderAllocatorScout_Destroy (int);
void ves_icall_System_Reflection_RuntimeAssembly_GetManifestResourceNames_raw (int,int,int);
void ves_icall_System_Reflection_RuntimeAssembly_GetExportedTypes_raw (int,int,int);
void ves_icall_System_Reflection_RuntimeAssembly_GetInfo_raw (int,int,int,int);
int ves_icall_System_Reflection_RuntimeAssembly_GetManifestResourceInfoInternal_raw (int,int,int,int);
int ves_icall_System_Reflection_RuntimeAssembly_GetManifestResourceInternal_raw (int,int,int,int,int);
void ves_icall_System_Reflection_Assembly_GetManifestModuleInternal_raw (int,int,int);
void ves_icall_System_Reflection_RuntimeAssembly_GetModulesInternal_raw (int,int,int);
void ves_icall_System_Reflection_RuntimeCustomAttributeData_ResolveArgumentsInternal_raw (int,int,int,int,int,int,int);
void ves_icall_RuntimeEventInfo_get_event_info_raw (int,int,int);
int ves_icall_reflection_get_token_raw (int,int);
int ves_icall_System_Reflection_EventInfo_internal_from_handle_type_raw (int,int,int);
int ves_icall_RuntimeFieldInfo_ResolveType_raw (int,int);
int ves_icall_RuntimeFieldInfo_GetParentType_raw (int,int,int);
int ves_icall_RuntimeFieldInfo_GetFieldOffset_raw (int,int);
int ves_icall_RuntimeFieldInfo_GetValueInternal_raw (int,int,int);
void ves_icall_RuntimeFieldInfo_SetValueInternal_raw (int,int,int,int);
int ves_icall_RuntimeFieldInfo_GetRawConstantValue_raw (int,int);
int ves_icall_reflection_get_token_raw (int,int);
void ves_icall_get_method_info_raw (int,int,int);
int ves_icall_get_method_attributes (int);
int ves_icall_System_Reflection_MonoMethodInfo_get_parameter_info_raw (int,int,int);
int ves_icall_System_MonoMethodInfo_get_retval_marshal_raw (int,int);
int ves_icall_System_Reflection_RuntimeMethodInfo_GetMethodFromHandleInternalType_native_raw (int,int,int,int);
int ves_icall_RuntimeMethodInfo_get_name_raw (int,int);
int ves_icall_RuntimeMethodInfo_get_base_method_raw (int,int,int);
int ves_icall_reflection_get_token_raw (int,int);
int ves_icall_InternalInvoke_raw (int,int,int,int,int);
void ves_icall_RuntimeMethodInfo_GetPInvoke_raw (int,int,int,int,int);
int ves_icall_RuntimeMethodInfo_MakeGenericMethod_impl_raw (int,int,int);
int ves_icall_RuntimeMethodInfo_GetGenericArguments_raw (int,int);
int ves_icall_RuntimeMethodInfo_GetGenericMethodDefinition_raw (int,int);
int ves_icall_RuntimeMethodInfo_get_IsGenericMethodDefinition_raw (int,int);
int ves_icall_RuntimeMethodInfo_get_IsGenericMethod_raw (int,int);
void ves_icall_InvokeClassConstructor_raw (int,int);
int ves_icall_InternalInvoke_raw (int,int,int,int,int);
int ves_icall_reflection_get_token_raw (int,int);
int ves_icall_System_Reflection_RuntimeModule_InternalGetTypes_raw (int,int);
int ves_icall_System_Reflection_RuntimeModule_ResolveMethodToken_raw (int,int,int,int,int,int);
int ves_icall_RuntimeParameterInfo_GetTypeModifiers_raw (int,int,int,int,int,int);
void ves_icall_RuntimePropertyInfo_get_property_info_raw (int,int,int,int);
int ves_icall_reflection_get_token_raw (int,int);
int ves_icall_System_Reflection_RuntimePropertyInfo_internal_from_handle_type_raw (int,int,int);
void ves_icall_DynamicMethod_create_dynamic_method_raw (int,int,int,int,int);
void ves_icall_AssemblyBuilder_basic_init_raw (int,int);
void ves_icall_AssemblyBuilder_UpdateNativeCustomAttributes_raw (int,int);
void ves_icall_ModuleBuilder_basic_init_raw (int,int);
void ves_icall_ModuleBuilder_set_wrappers_type_raw (int,int,int);
int ves_icall_ModuleBuilder_getUSIndex_raw (int,int,int);
int ves_icall_ModuleBuilder_getToken_raw (int,int,int,int);
int ves_icall_ModuleBuilder_getMethodToken_raw (int,int,int,int);
void ves_icall_ModuleBuilder_RegisterToken_raw (int,int,int,int);
int ves_icall_TypeBuilder_create_runtime_class_raw (int,int);
int ves_icall_System_IO_Stream_HasOverriddenBeginEndRead_raw (int,int);
int ves_icall_System_IO_Stream_HasOverriddenBeginEndWrite_raw (int,int);
int ves_icall_System_Diagnostics_Debugger_IsAttached_internal ();
int ves_icall_System_Diagnostics_StackFrame_GetFrameInfo (int,int,int,int,int,int,int,int);
void ves_icall_System_Diagnostics_StackTrace_GetTrace (int,int,int,int);
int ves_icall_Mono_RuntimeClassHandle_GetTypeFromClass (int);
void ves_icall_Mono_RuntimeGPtrArrayHandle_GPtrArrayFree (int);
int ves_icall_Mono_SafeStringMarshal_StringToUtf8 (int);
void ves_icall_Mono_SafeStringMarshal_GFree (int);
static void *corlib_icall_funcs [] = {
// token 246,
ves_icall_System_Array_InternalCreate,
// token 259,
ves_icall_System_Array_GetCorElementTypeOfElementTypeInternal,
// token 260,
ves_icall_System_Array_IsValueOfElementTypeInternal,
// token 261,
ves_icall_System_Array_CanChangePrimitive,
// token 262,
ves_icall_System_Array_FastCopy,
// token 263,
ves_icall_System_Array_GetLengthInternal_raw,
// token 264,
ves_icall_System_Array_GetLowerBoundInternal_raw,
// token 265,
ves_icall_System_Array_GetGenericValue_icall,
// token 266,
ves_icall_System_Array_GetValueImpl_raw,
// token 267,
ves_icall_System_Array_SetGenericValue_icall,
// token 270,
ves_icall_System_Array_SetValueImpl_raw,
// token 271,
ves_icall_System_Array_InitializeInternal_raw,
// token 272,
ves_icall_System_Array_SetValueRelaxedImpl_raw,
// token 450,
ves_icall_System_Runtime_RuntimeImports_ZeroMemory,
// token 451,
ves_icall_System_Runtime_RuntimeImports_Memmove,
// token 452,
ves_icall_System_Buffer_BulkMoveWithWriteBarrier,
// token 480,
ves_icall_System_Delegate_AllocDelegateLike_internal_raw,
// token 481,
ves_icall_System_Delegate_CreateDelegate_internal_raw,
// token 482,
ves_icall_System_Delegate_GetVirtualMethod_internal_raw,
// token 509,
ves_icall_System_Enum_GetEnumValuesAndNames_raw,
// token 510,
ves_icall_System_Enum_InternalGetCorElementType,
// token 511,
ves_icall_System_Enum_InternalGetUnderlyingType_raw,
// token 609,
ves_icall_System_Environment_get_ProcessorCount,
// token 610,
ves_icall_System_Environment_get_TickCount,
// token 611,
ves_icall_System_Environment_get_TickCount64,
// token 612,
ves_icall_System_Environment_Exit,
// token 613,
ves_icall_System_Environment_GetCommandLineArgs_raw,
// token 616,
ves_icall_System_Environment_FailFast_raw,
// token 658,
ves_icall_System_GC_GetMaxGeneration,
// token 659,
ves_icall_System_GC_InternalCollect,
// token 660,
ves_icall_System_GC_register_ephemeron_array_raw,
// token 661,
ves_icall_System_GC_get_ephemeron_tombstone_raw,
// token 665,
ves_icall_System_GC_SuppressFinalize_raw,
// token 667,
ves_icall_System_GC_ReRegisterForFinalize_raw,
// token 669,
ves_icall_System_GC_GetGCMemoryInfo,
// token 671,
ves_icall_System_GC_AllocPinnedArray_raw,
// token 676,
ves_icall_System_Object_MemberwiseClone_raw,
// token 684,
ves_icall_System_Math_Acos,
// token 685,
ves_icall_System_Math_Acosh,
// token 686,
ves_icall_System_Math_Asin,
// token 687,
ves_icall_System_Math_Asinh,
// token 688,
ves_icall_System_Math_Atan,
// token 689,
ves_icall_System_Math_Atan2,
// token 690,
ves_icall_System_Math_Atanh,
// token 691,
ves_icall_System_Math_Cbrt,
// token 692,
ves_icall_System_Math_Ceiling,
// token 693,
ves_icall_System_Math_Cos,
// token 694,
ves_icall_System_Math_Cosh,
// token 695,
ves_icall_System_Math_Exp,
// token 696,
ves_icall_System_Math_Floor,
// token 697,
ves_icall_System_Math_Log,
// token 698,
ves_icall_System_Math_Log10,
// token 699,
ves_icall_System_Math_Pow,
// token 700,
ves_icall_System_Math_Sin,
// token 702,
ves_icall_System_Math_Sinh,
// token 703,
ves_icall_System_Math_Sqrt,
// token 704,
ves_icall_System_Math_Tan,
// token 705,
ves_icall_System_Math_Tanh,
// token 706,
ves_icall_System_Math_FusedMultiplyAdd,
// token 707,
ves_icall_System_Math_Log2,
// token 708,
ves_icall_System_Math_ModF,
// token 795,
ves_icall_System_MathF_Acos,
// token 796,
ves_icall_System_MathF_Acosh,
// token 797,
ves_icall_System_MathF_Asin,
// token 798,
ves_icall_System_MathF_Asinh,
// token 799,
ves_icall_System_MathF_Atan,
// token 800,
ves_icall_System_MathF_Atan2,
// token 801,
ves_icall_System_MathF_Atanh,
// token 802,
ves_icall_System_MathF_Cbrt,
// token 803,
ves_icall_System_MathF_Ceiling,
// token 804,
ves_icall_System_MathF_Cos,
// token 805,
ves_icall_System_MathF_Cosh,
// token 806,
ves_icall_System_MathF_Exp,
// token 807,
ves_icall_System_MathF_Floor,
// token 808,
ves_icall_System_MathF_Log,
// token 809,
ves_icall_System_MathF_Log10,
// token 810,
ves_icall_System_MathF_Pow,
// token 811,
ves_icall_System_MathF_Sin,
// token 813,
ves_icall_System_MathF_Sinh,
// token 814,
ves_icall_System_MathF_Sqrt,
// token 815,
ves_icall_System_MathF_Tan,
// token 816,
ves_icall_System_MathF_Tanh,
// token 817,
ves_icall_System_MathF_FusedMultiplyAdd,
// token 818,
ves_icall_System_MathF_Log2,
// token 819,
ves_icall_System_MathF_ModF,
// token 881,
ves_icall_RuntimeMethodHandle_GetFunctionPointer_raw,
// token 890,
ves_icall_RuntimeMethodHandle_ReboxFromNullable_raw,
// token 891,
ves_icall_RuntimeMethodHandle_ReboxToNullable_raw,
// token 961,
ves_icall_RuntimeType_GetCorrespondingInflatedMethod_raw,
// token 967,
ves_icall_RuntimeType_make_array_type_raw,
// token 970,
ves_icall_RuntimeType_make_byref_type_raw,
// token 972,
ves_icall_RuntimeType_make_pointer_type_raw,
// token 977,
ves_icall_RuntimeType_MakeGenericType_raw,
// token 978,
ves_icall_RuntimeType_GetMethodsByName_native_raw,
// token 980,
ves_icall_RuntimeType_GetPropertiesByName_native_raw,
// token 981,
ves_icall_RuntimeType_GetConstructors_native_raw,
// token 985,
ves_icall_RuntimeType_GetInterfaceMapData_raw,
// token 987,
ves_icall_System_RuntimeType_CreateInstanceInternal_raw,
// token 988,
ves_icall_RuntimeType_GetDeclaringMethod_raw,
// token 990,
ves_icall_System_RuntimeType_getFullName_raw,
// token 991,
ves_icall_RuntimeType_GetGenericArgumentsInternal_raw,
// token 994,
ves_icall_RuntimeType_GetGenericParameterPosition,
// token 995,
ves_icall_RuntimeType_GetEvents_native_raw,
// token 996,
ves_icall_RuntimeType_GetFields_native_raw,
// token 999,
ves_icall_RuntimeType_GetInterfaces_raw,
// token 1001,
ves_icall_RuntimeType_GetNestedTypes_native_raw,
// token 1004,
ves_icall_RuntimeType_GetDeclaringType_raw,
// token 1006,
ves_icall_RuntimeType_GetName_raw,
// token 1008,
ves_icall_RuntimeType_GetNamespace_raw,
// token 1017,
ves_icall_RuntimeType_FunctionPointerReturnAndParameterTypes_raw,
// token 1084,
ves_icall_RuntimeTypeHandle_GetAttributes,
// token 1086,
ves_icall_RuntimeTypeHandle_GetMetadataToken_raw,
// token 1088,
ves_icall_RuntimeTypeHandle_GetGenericTypeDefinition_impl_raw,
// token 1098,
ves_icall_RuntimeTypeHandle_GetCorElementType,
// token 1099,
ves_icall_RuntimeTypeHandle_HasInstantiation,
// token 1100,
ves_icall_RuntimeTypeHandle_IsInstanceOfType_raw,
// token 1102,
ves_icall_RuntimeTypeHandle_HasReferences_raw,
// token 1108,
ves_icall_RuntimeTypeHandle_GetArrayRank_raw,
// token 1109,
ves_icall_RuntimeTypeHandle_GetAssembly_raw,
// token 1110,
ves_icall_RuntimeTypeHandle_GetElementType_raw,
// token 1111,
ves_icall_RuntimeTypeHandle_GetModule_raw,
// token 1112,
ves_icall_RuntimeTypeHandle_GetBaseType_raw,
// token 1120,
ves_icall_RuntimeTypeHandle_type_is_assignable_from_raw,
// token 1121,
ves_icall_RuntimeTypeHandle_IsGenericTypeDefinition,
// token 1122,
ves_icall_RuntimeTypeHandle_GetGenericParameterInfo_raw,
// token 1126,
ves_icall_RuntimeTypeHandle_is_subclass_of_raw,
// token 1127,
ves_icall_RuntimeTypeHandle_IsByRefLike_raw,
// token 1129,
ves_icall_System_RuntimeTypeHandle_internal_from_name_raw,
// token 1133,
ves_icall_System_String_FastAllocateString_raw,
// token 1134,
ves_icall_System_String_InternalIsInterned_raw,
// token 1135,
ves_icall_System_String_InternalIntern_raw,
// token 1427,
ves_icall_System_Type_internal_from_handle_raw,
// token 1619,
ves_icall_System_ValueType_InternalGetHashCode_raw,
// token 1620,
ves_icall_System_ValueType_Equals_raw,
// token 9388,
ves_icall_System_Threading_Interlocked_CompareExchange_Int,
// token 9389,
ves_icall_System_Threading_Interlocked_CompareExchange_Object,
// token 9391,
ves_icall_System_Threading_Interlocked_Decrement_Int,
// token 9392,
ves_icall_System_Threading_Interlocked_Increment_Int,
// token 9393,
ves_icall_System_Threading_Interlocked_Increment_Long,
// token 9394,
ves_icall_System_Threading_Interlocked_Exchange_Int,
// token 9395,
ves_icall_System_Threading_Interlocked_Exchange_Object,
// token 9397,
ves_icall_System_Threading_Interlocked_CompareExchange_Long,
// token 9398,
ves_icall_System_Threading_Interlocked_Exchange_Long,
// token 9399,
ves_icall_System_Threading_Interlocked_Read_Long,
// token 9400,
ves_icall_System_Threading_Interlocked_Add_Int,
// token 9401,
ves_icall_System_Threading_Interlocked_Add_Long,
// token 9418,
ves_icall_System_Threading_Monitor_Monitor_Enter_raw,
// token 9420,
mono_monitor_exit_icall_raw,
// token 9425,
ves_icall_System_Threading_Monitor_Monitor_pulse_raw,
// token 9427,
ves_icall_System_Threading_Monitor_Monitor_pulse_all_raw,
// token 9429,
ves_icall_System_Threading_Monitor_Monitor_wait_raw,
// token 9431,
ves_icall_System_Threading_Monitor_Monitor_try_enter_with_atomic_var_raw,
// token 9483,
ves_icall_System_Threading_Thread_InitInternal_raw,
// token 9484,
ves_icall_System_Threading_Thread_GetCurrentThread,
// token 9486,
ves_icall_System_Threading_InternalThread_Thread_free_internal_raw,
// token 9487,
ves_icall_System_Threading_Thread_GetState_raw,
// token 9488,
ves_icall_System_Threading_Thread_SetState_raw,
// token 9489,
ves_icall_System_Threading_Thread_ClrState_raw,
// token 9490,
ves_icall_System_Threading_Thread_SetName_icall_raw,
// token 9492,
ves_icall_System_Threading_Thread_YieldInternal,
// token 9494,
ves_icall_System_Threading_Thread_SetPriority_raw,
// token 10617,
ves_icall_System_Runtime_Loader_AssemblyLoadContext_PrepareForAssemblyLoadContextRelease_raw,
// token 10621,
ves_icall_System_Runtime_Loader_AssemblyLoadContext_GetLoadContextForAssembly_raw,
// token 10623,
ves_icall_System_Runtime_Loader_AssemblyLoadContext_InternalLoadFile_raw,
// token 10624,
ves_icall_System_Runtime_Loader_AssemblyLoadContext_InternalInitializeNativeALC_raw,
// token 10625,
ves_icall_System_Runtime_Loader_AssemblyLoadContext_InternalLoadFromStream_raw,
// token 10626,
ves_icall_System_Runtime_Loader_AssemblyLoadContext_InternalGetLoadedAssemblies_raw,
// token 11058,
ves_icall_System_GCHandle_InternalAlloc_raw,
// token 11059,
ves_icall_System_GCHandle_InternalFree_raw,
// token 11060,
ves_icall_System_GCHandle_InternalGet_raw,
// token 11061,
ves_icall_System_GCHandle_InternalSet_raw,
// token 11079,
ves_icall_System_Runtime_InteropServices_Marshal_GetLastPInvokeError,
// token 11080,
ves_icall_System_Runtime_InteropServices_Marshal_SetLastPInvokeError,
// token 11081,
ves_icall_System_Runtime_InteropServices_Marshal_StructureToPtr_raw,
// token 11083,
ves_icall_System_Runtime_InteropServices_Marshal_SizeOfHelper_raw,
// token 11131,
ves_icall_System_Runtime_InteropServices_NativeLibrary_LoadByName_raw,
// token 11217,
ves_icall_System_Runtime_CompilerServices_RuntimeHelpers_InternalGetHashCode_raw,
// token 11220,
ves_icall_System_Runtime_CompilerServices_RuntimeHelpers_GetObjectValue_raw,
// token 11229,
ves_icall_System_Runtime_CompilerServices_RuntimeHelpers_GetUninitializedObjectInternal_raw,
// token 11230,
ves_icall_System_Runtime_CompilerServices_RuntimeHelpers_InitializeArray_raw,
// token 11231,
ves_icall_System_Runtime_CompilerServices_RuntimeHelpers_GetSpanDataFrom_raw,
// token 11232,
ves_icall_System_Runtime_CompilerServices_RuntimeHelpers_RunClassConstructor_raw,
// token 11233,
ves_icall_System_Runtime_CompilerServices_RuntimeHelpers_SufficientExecutionStack,
// token 11234,
ves_icall_System_Runtime_CompilerServices_RuntimeHelpers_InternalBox_raw,
// token 11588,
ves_icall_System_Reflection_Assembly_GetExecutingAssembly_raw,
// token 11589,
ves_icall_System_Reflection_Assembly_GetEntryAssembly_raw,
// token 11594,
ves_icall_System_Reflection_Assembly_InternalLoad_raw,
// token 11595,
ves_icall_System_Reflection_Assembly_InternalGetType_raw,
// token 11631,
ves_icall_System_Reflection_AssemblyName_GetNativeName,
// token 11668,
ves_icall_MonoCustomAttrs_GetCustomAttributesInternal_raw,
// token 11675,
ves_icall_MonoCustomAttrs_GetCustomAttributesDataInternal_raw,
// token 11682,
ves_icall_MonoCustomAttrs_IsDefinedInternal_raw,
// token 11693,
ves_icall_System_Reflection_FieldInfo_internal_from_handle_type_raw,
// token 11696,
ves_icall_System_Reflection_FieldInfo_get_marshal_info_raw,
// token 11721,
ves_icall_System_Reflection_LoaderAllocatorScout_Destroy,
// token 11806,
ves_icall_System_Reflection_RuntimeAssembly_GetManifestResourceNames_raw,
// token 11808,
ves_icall_System_Reflection_RuntimeAssembly_GetExportedTypes_raw,
// token 11820,
ves_icall_System_Reflection_RuntimeAssembly_GetInfo_raw,
// token 11822,
ves_icall_System_Reflection_RuntimeAssembly_GetManifestResourceInfoInternal_raw,
// token 11823,
ves_icall_System_Reflection_RuntimeAssembly_GetManifestResourceInternal_raw,
// token 11824,
ves_icall_System_Reflection_Assembly_GetManifestModuleInternal_raw,
// token 11825,
ves_icall_System_Reflection_RuntimeAssembly_GetModulesInternal_raw,
// token 11832,
ves_icall_System_Reflection_RuntimeCustomAttributeData_ResolveArgumentsInternal_raw,
// token 11847,
ves_icall_RuntimeEventInfo_get_event_info_raw,
// token 11867,
ves_icall_reflection_get_token_raw,
// token 11868,
ves_icall_System_Reflection_EventInfo_internal_from_handle_type_raw,
// token 11876,
ves_icall_RuntimeFieldInfo_ResolveType_raw,
// token 11878,
ves_icall_RuntimeFieldInfo_GetParentType_raw,
// token 11885,
ves_icall_RuntimeFieldInfo_GetFieldOffset_raw,
// token 11886,
ves_icall_RuntimeFieldInfo_GetValueInternal_raw,
// token 11889,
ves_icall_RuntimeFieldInfo_SetValueInternal_raw,
// token 11891,
ves_icall_RuntimeFieldInfo_GetRawConstantValue_raw,
// token 11896,
ves_icall_reflection_get_token_raw,
// token 11902,
ves_icall_get_method_info_raw,
// token 11903,
ves_icall_get_method_attributes,
// token 11910,
ves_icall_System_Reflection_MonoMethodInfo_get_parameter_info_raw,
// token 11912,
ves_icall_System_MonoMethodInfo_get_retval_marshal_raw,
// token 11924,
ves_icall_System_Reflection_RuntimeMethodInfo_GetMethodFromHandleInternalType_native_raw,
// token 11927,
ves_icall_RuntimeMethodInfo_get_name_raw,
// token 11928,
ves_icall_RuntimeMethodInfo_get_base_method_raw,
// token 11929,
ves_icall_reflection_get_token_raw,
// token 11940,
ves_icall_InternalInvoke_raw,
// token 11950,
ves_icall_RuntimeMethodInfo_GetPInvoke_raw,
// token 11956,
ves_icall_RuntimeMethodInfo_MakeGenericMethod_impl_raw,
// token 11957,
ves_icall_RuntimeMethodInfo_GetGenericArguments_raw,
// token 11958,
ves_icall_RuntimeMethodInfo_GetGenericMethodDefinition_raw,
// token 11960,
ves_icall_RuntimeMethodInfo_get_IsGenericMethodDefinition_raw,
// token 11961,
ves_icall_RuntimeMethodInfo_get_IsGenericMethod_raw,
// token 11978,
ves_icall_InvokeClassConstructor_raw,
// token 11980,
ves_icall_InternalInvoke_raw,
// token 11995,
ves_icall_reflection_get_token_raw,
// token 12015,
ves_icall_System_Reflection_RuntimeModule_InternalGetTypes_raw,
// token 12016,
ves_icall_System_Reflection_RuntimeModule_ResolveMethodToken_raw,
// token 12041,
ves_icall_RuntimeParameterInfo_GetTypeModifiers_raw,
// token 12046,
ves_icall_RuntimePropertyInfo_get_property_info_raw,
// token 12076,
ves_icall_reflection_get_token_raw,
// token 12077,
ves_icall_System_Reflection_RuntimePropertyInfo_internal_from_handle_type_raw,
// token 12658,
ves_icall_DynamicMethod_create_dynamic_method_raw,
// token 12748,
ves_icall_AssemblyBuilder_basic_init_raw,
// token 12749,
ves_icall_AssemblyBuilder_UpdateNativeCustomAttributes_raw,
// token 12970,
ves_icall_ModuleBuilder_basic_init_raw,
// token 12971,
ves_icall_ModuleBuilder_set_wrappers_type_raw,
// token 12979,
ves_icall_ModuleBuilder_getUSIndex_raw,
// token 12980,
ves_icall_ModuleBuilder_getToken_raw,
// token 12981,
ves_icall_ModuleBuilder_getMethodToken_raw,
// token 12987,
ves_icall_ModuleBuilder_RegisterToken_raw,
// token 13054,
ves_icall_TypeBuilder_create_runtime_class_raw,
// token 13738,
ves_icall_System_IO_Stream_HasOverriddenBeginEndRead_raw,
// token 13739,
ves_icall_System_IO_Stream_HasOverriddenBeginEndWrite_raw,
// token 14337,
ves_icall_System_Diagnostics_Debugger_IsAttached_internal,
// token 14342,
ves_icall_System_Diagnostics_StackFrame_GetFrameInfo,
// token 14352,
ves_icall_System_Diagnostics_StackTrace_GetTrace,
// token 15386,
ves_icall_Mono_RuntimeClassHandle_GetTypeFromClass,
// token 15407,
ves_icall_Mono_RuntimeGPtrArrayHandle_GPtrArrayFree,
// token 15409,
ves_icall_Mono_SafeStringMarshal_StringToUtf8,
// token 15411,
ves_icall_Mono_SafeStringMarshal_GFree,
};
static uint8_t corlib_icall_flags [] = {
0,
0,
0,
0,
0,
4,
4,
0,
4,
0,
4,
4,
4,
0,
0,
0,
4,
4,
4,
4,
0,
4,
0,
0,
0,
0,
4,
4,
0,
0,
4,
4,
4,
4,
0,
4,
4,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
4,
4,
4,
4,
4,
4,
4,
4,
4,
4,
4,
4,
4,
4,
4,
4,
0,
4,
4,
4,
4,
4,
4,
4,
4,
0,
4,
4,
0,
0,
4,
4,
4,
4,
4,
4,
4,
4,
0,
4,
4,
4,
4,
4,
4,
4,
4,
4,
4,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
4,
4,
4,
4,
4,
4,
4,
0,
4,
4,
4,
4,
4,
0,
4,
4,
4,
4,
4,
4,
4,
4,
4,
4,
4,
0,
0,
4,
4,
4,
4,
4,
4,
4,
4,
4,
0,
4,
4,
4,
4,
4,
0,
4,
4,
4,
4,
4,
0,
4,
4,
4,
4,
4,
4,
4,
4,
4,
4,
4,
4,
4,
4,
4,
4,
4,
4,
4,
0,
4,
4,
4,
4,
4,
4,
4,
4,
4,
4,
4,
4,
4,
4,
4,
4,
4,
4,
4,
4,
4,
4,
4,
4,
4,
4,
4,
4,
4,
4,
4,
4,
4,
4,
0,
0,
0,
0,
0,
0,
0,
};
