#define ICALL_TABLE_corlib 1

static int corlib_icall_indexes [] = {
244,
257,
258,
259,
260,
261,
262,
263,
264,
265,
268,
269,
270,
441,
442,
443,
471,
472,
473,
500,
501,
502,
595,
596,
597,
598,
599,
602,
642,
643,
644,
645,
649,
651,
653,
655,
660,
668,
669,
670,
671,
672,
673,
674,
675,
676,
677,
678,
679,
680,
681,
682,
683,
684,
686,
687,
688,
689,
690,
691,
692,
779,
780,
781,
782,
783,
784,
785,
786,
787,
788,
789,
790,
791,
792,
793,
794,
795,
797,
798,
799,
800,
801,
802,
803,
865,
874,
875,
945,
951,
954,
956,
961,
962,
964,
965,
969,
970,
972,
973,
976,
977,
978,
981,
983,
986,
988,
990,
999,
1064,
1066,
1068,
1078,
1079,
1080,
1082,
1088,
1089,
1090,
1091,
1092,
1100,
1101,
1102,
1106,
1107,
1109,
1113,
1114,
1115,
1407,
1597,
1598,
9209,
9210,
9212,
9213,
9214,
9215,
9216,
9218,
9219,
9220,
9221,
9222,
9239,
9241,
9246,
9248,
9250,
9252,
9304,
9305,
9307,
9308,
9309,
9310,
9311,
9313,
9315,
10431,
10435,
10437,
10438,
10439,
10440,
10871,
10872,
10873,
10874,
10892,
10893,
10894,
10940,
11022,
11025,
11034,
11035,
11036,
11037,
11038,
11039,
11384,
11385,
11389,
11390,
11422,
11459,
11466,
11473,
11484,
11487,
11512,
11596,
11598,
11610,
11612,
11613,
11614,
11615,
11622,
11637,
11657,
11658,
11666,
11668,
11675,
11676,
11679,
11681,
11686,
11692,
11693,
11700,
11702,
11714,
11717,
11718,
11719,
11730,
11740,
11746,
11747,
11748,
11750,
11751,
11768,
11770,
11785,
11805,
11806,
11831,
11836,
11866,
11867,
12423,
12511,
12512,
12733,
12734,
12742,
12743,
12744,
12750,
12817,
13469,
13470,
14052,
14057,
14067,
15040,
15061,
15063,
15065,
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
// token 244,
ves_icall_System_Array_InternalCreate,
// token 257,
ves_icall_System_Array_GetCorElementTypeOfElementTypeInternal,
// token 258,
ves_icall_System_Array_IsValueOfElementTypeInternal,
// token 259,
ves_icall_System_Array_CanChangePrimitive,
// token 260,
ves_icall_System_Array_FastCopy,
// token 261,
ves_icall_System_Array_GetLengthInternal_raw,
// token 262,
ves_icall_System_Array_GetLowerBoundInternal_raw,
// token 263,
ves_icall_System_Array_GetGenericValue_icall,
// token 264,
ves_icall_System_Array_GetValueImpl_raw,
// token 265,
ves_icall_System_Array_SetGenericValue_icall,
// token 268,
ves_icall_System_Array_SetValueImpl_raw,
// token 269,
ves_icall_System_Array_InitializeInternal_raw,
// token 270,
ves_icall_System_Array_SetValueRelaxedImpl_raw,
// token 441,
ves_icall_System_Runtime_RuntimeImports_ZeroMemory,
// token 442,
ves_icall_System_Runtime_RuntimeImports_Memmove,
// token 443,
ves_icall_System_Buffer_BulkMoveWithWriteBarrier,
// token 471,
ves_icall_System_Delegate_AllocDelegateLike_internal_raw,
// token 472,
ves_icall_System_Delegate_CreateDelegate_internal_raw,
// token 473,
ves_icall_System_Delegate_GetVirtualMethod_internal_raw,
// token 500,
ves_icall_System_Enum_GetEnumValuesAndNames_raw,
// token 501,
ves_icall_System_Enum_InternalGetCorElementType,
// token 502,
ves_icall_System_Enum_InternalGetUnderlyingType_raw,
// token 595,
ves_icall_System_Environment_get_ProcessorCount,
// token 596,
ves_icall_System_Environment_get_TickCount,
// token 597,
ves_icall_System_Environment_get_TickCount64,
// token 598,
ves_icall_System_Environment_Exit,
// token 599,
ves_icall_System_Environment_GetCommandLineArgs_raw,
// token 602,
ves_icall_System_Environment_FailFast_raw,
// token 642,
ves_icall_System_GC_GetMaxGeneration,
// token 643,
ves_icall_System_GC_InternalCollect,
// token 644,
ves_icall_System_GC_register_ephemeron_array_raw,
// token 645,
ves_icall_System_GC_get_ephemeron_tombstone_raw,
// token 649,
ves_icall_System_GC_SuppressFinalize_raw,
// token 651,
ves_icall_System_GC_ReRegisterForFinalize_raw,
// token 653,
ves_icall_System_GC_GetGCMemoryInfo,
// token 655,
ves_icall_System_GC_AllocPinnedArray_raw,
// token 660,
ves_icall_System_Object_MemberwiseClone_raw,
// token 668,
ves_icall_System_Math_Acos,
// token 669,
ves_icall_System_Math_Acosh,
// token 670,
ves_icall_System_Math_Asin,
// token 671,
ves_icall_System_Math_Asinh,
// token 672,
ves_icall_System_Math_Atan,
// token 673,
ves_icall_System_Math_Atan2,
// token 674,
ves_icall_System_Math_Atanh,
// token 675,
ves_icall_System_Math_Cbrt,
// token 676,
ves_icall_System_Math_Ceiling,
// token 677,
ves_icall_System_Math_Cos,
// token 678,
ves_icall_System_Math_Cosh,
// token 679,
ves_icall_System_Math_Exp,
// token 680,
ves_icall_System_Math_Floor,
// token 681,
ves_icall_System_Math_Log,
// token 682,
ves_icall_System_Math_Log10,
// token 683,
ves_icall_System_Math_Pow,
// token 684,
ves_icall_System_Math_Sin,
// token 686,
ves_icall_System_Math_Sinh,
// token 687,
ves_icall_System_Math_Sqrt,
// token 688,
ves_icall_System_Math_Tan,
// token 689,
ves_icall_System_Math_Tanh,
// token 690,
ves_icall_System_Math_FusedMultiplyAdd,
// token 691,
ves_icall_System_Math_Log2,
// token 692,
ves_icall_System_Math_ModF,
// token 779,
ves_icall_System_MathF_Acos,
// token 780,
ves_icall_System_MathF_Acosh,
// token 781,
ves_icall_System_MathF_Asin,
// token 782,
ves_icall_System_MathF_Asinh,
// token 783,
ves_icall_System_MathF_Atan,
// token 784,
ves_icall_System_MathF_Atan2,
// token 785,
ves_icall_System_MathF_Atanh,
// token 786,
ves_icall_System_MathF_Cbrt,
// token 787,
ves_icall_System_MathF_Ceiling,
// token 788,
ves_icall_System_MathF_Cos,
// token 789,
ves_icall_System_MathF_Cosh,
// token 790,
ves_icall_System_MathF_Exp,
// token 791,
ves_icall_System_MathF_Floor,
// token 792,
ves_icall_System_MathF_Log,
// token 793,
ves_icall_System_MathF_Log10,
// token 794,
ves_icall_System_MathF_Pow,
// token 795,
ves_icall_System_MathF_Sin,
// token 797,
ves_icall_System_MathF_Sinh,
// token 798,
ves_icall_System_MathF_Sqrt,
// token 799,
ves_icall_System_MathF_Tan,
// token 800,
ves_icall_System_MathF_Tanh,
// token 801,
ves_icall_System_MathF_FusedMultiplyAdd,
// token 802,
ves_icall_System_MathF_Log2,
// token 803,
ves_icall_System_MathF_ModF,
// token 865,
ves_icall_RuntimeMethodHandle_GetFunctionPointer_raw,
// token 874,
ves_icall_RuntimeMethodHandle_ReboxFromNullable_raw,
// token 875,
ves_icall_RuntimeMethodHandle_ReboxToNullable_raw,
// token 945,
ves_icall_RuntimeType_GetCorrespondingInflatedMethod_raw,
// token 951,
ves_icall_RuntimeType_make_array_type_raw,
// token 954,
ves_icall_RuntimeType_make_byref_type_raw,
// token 956,
ves_icall_RuntimeType_make_pointer_type_raw,
// token 961,
ves_icall_RuntimeType_MakeGenericType_raw,
// token 962,
ves_icall_RuntimeType_GetMethodsByName_native_raw,
// token 964,
ves_icall_RuntimeType_GetPropertiesByName_native_raw,
// token 965,
ves_icall_RuntimeType_GetConstructors_native_raw,
// token 969,
ves_icall_System_RuntimeType_CreateInstanceInternal_raw,
// token 970,
ves_icall_RuntimeType_GetDeclaringMethod_raw,
// token 972,
ves_icall_System_RuntimeType_getFullName_raw,
// token 973,
ves_icall_RuntimeType_GetGenericArgumentsInternal_raw,
// token 976,
ves_icall_RuntimeType_GetGenericParameterPosition,
// token 977,
ves_icall_RuntimeType_GetEvents_native_raw,
// token 978,
ves_icall_RuntimeType_GetFields_native_raw,
// token 981,
ves_icall_RuntimeType_GetInterfaces_raw,
// token 983,
ves_icall_RuntimeType_GetNestedTypes_native_raw,
// token 986,
ves_icall_RuntimeType_GetDeclaringType_raw,
// token 988,
ves_icall_RuntimeType_GetName_raw,
// token 990,
ves_icall_RuntimeType_GetNamespace_raw,
// token 999,
ves_icall_RuntimeType_FunctionPointerReturnAndParameterTypes_raw,
// token 1064,
ves_icall_RuntimeTypeHandle_GetAttributes,
// token 1066,
ves_icall_RuntimeTypeHandle_GetMetadataToken_raw,
// token 1068,
ves_icall_RuntimeTypeHandle_GetGenericTypeDefinition_impl_raw,
// token 1078,
ves_icall_RuntimeTypeHandle_GetCorElementType,
// token 1079,
ves_icall_RuntimeTypeHandle_HasInstantiation,
// token 1080,
ves_icall_RuntimeTypeHandle_IsInstanceOfType_raw,
// token 1082,
ves_icall_RuntimeTypeHandle_HasReferences_raw,
// token 1088,
ves_icall_RuntimeTypeHandle_GetArrayRank_raw,
// token 1089,
ves_icall_RuntimeTypeHandle_GetAssembly_raw,
// token 1090,
ves_icall_RuntimeTypeHandle_GetElementType_raw,
// token 1091,
ves_icall_RuntimeTypeHandle_GetModule_raw,
// token 1092,
ves_icall_RuntimeTypeHandle_GetBaseType_raw,
// token 1100,
ves_icall_RuntimeTypeHandle_type_is_assignable_from_raw,
// token 1101,
ves_icall_RuntimeTypeHandle_IsGenericTypeDefinition,
// token 1102,
ves_icall_RuntimeTypeHandle_GetGenericParameterInfo_raw,
// token 1106,
ves_icall_RuntimeTypeHandle_is_subclass_of_raw,
// token 1107,
ves_icall_RuntimeTypeHandle_IsByRefLike_raw,
// token 1109,
ves_icall_System_RuntimeTypeHandle_internal_from_name_raw,
// token 1113,
ves_icall_System_String_FastAllocateString_raw,
// token 1114,
ves_icall_System_String_InternalIsInterned_raw,
// token 1115,
ves_icall_System_String_InternalIntern_raw,
// token 1407,
ves_icall_System_Type_internal_from_handle_raw,
// token 1597,
ves_icall_System_ValueType_InternalGetHashCode_raw,
// token 1598,
ves_icall_System_ValueType_Equals_raw,
// token 9209,
ves_icall_System_Threading_Interlocked_CompareExchange_Int,
// token 9210,
ves_icall_System_Threading_Interlocked_CompareExchange_Object,
// token 9212,
ves_icall_System_Threading_Interlocked_Decrement_Int,
// token 9213,
ves_icall_System_Threading_Interlocked_Increment_Int,
// token 9214,
ves_icall_System_Threading_Interlocked_Increment_Long,
// token 9215,
ves_icall_System_Threading_Interlocked_Exchange_Int,
// token 9216,
ves_icall_System_Threading_Interlocked_Exchange_Object,
// token 9218,
ves_icall_System_Threading_Interlocked_CompareExchange_Long,
// token 9219,
ves_icall_System_Threading_Interlocked_Exchange_Long,
// token 9220,
ves_icall_System_Threading_Interlocked_Read_Long,
// token 9221,
ves_icall_System_Threading_Interlocked_Add_Int,
// token 9222,
ves_icall_System_Threading_Interlocked_Add_Long,
// token 9239,
ves_icall_System_Threading_Monitor_Monitor_Enter_raw,
// token 9241,
mono_monitor_exit_icall_raw,
// token 9246,
ves_icall_System_Threading_Monitor_Monitor_pulse_raw,
// token 9248,
ves_icall_System_Threading_Monitor_Monitor_pulse_all_raw,
// token 9250,
ves_icall_System_Threading_Monitor_Monitor_wait_raw,
// token 9252,
ves_icall_System_Threading_Monitor_Monitor_try_enter_with_atomic_var_raw,
// token 9304,
ves_icall_System_Threading_Thread_InitInternal_raw,
// token 9305,
ves_icall_System_Threading_Thread_GetCurrentThread,
// token 9307,
ves_icall_System_Threading_InternalThread_Thread_free_internal_raw,
// token 9308,
ves_icall_System_Threading_Thread_GetState_raw,
// token 9309,
ves_icall_System_Threading_Thread_SetState_raw,
// token 9310,
ves_icall_System_Threading_Thread_ClrState_raw,
// token 9311,
ves_icall_System_Threading_Thread_SetName_icall_raw,
// token 9313,
ves_icall_System_Threading_Thread_YieldInternal,
// token 9315,
ves_icall_System_Threading_Thread_SetPriority_raw,
// token 10431,
ves_icall_System_Runtime_Loader_AssemblyLoadContext_PrepareForAssemblyLoadContextRelease_raw,
// token 10435,
ves_icall_System_Runtime_Loader_AssemblyLoadContext_GetLoadContextForAssembly_raw,
// token 10437,
ves_icall_System_Runtime_Loader_AssemblyLoadContext_InternalLoadFile_raw,
// token 10438,
ves_icall_System_Runtime_Loader_AssemblyLoadContext_InternalInitializeNativeALC_raw,
// token 10439,
ves_icall_System_Runtime_Loader_AssemblyLoadContext_InternalLoadFromStream_raw,
// token 10440,
ves_icall_System_Runtime_Loader_AssemblyLoadContext_InternalGetLoadedAssemblies_raw,
// token 10871,
ves_icall_System_GCHandle_InternalAlloc_raw,
// token 10872,
ves_icall_System_GCHandle_InternalFree_raw,
// token 10873,
ves_icall_System_GCHandle_InternalGet_raw,
// token 10874,
ves_icall_System_GCHandle_InternalSet_raw,
// token 10892,
ves_icall_System_Runtime_InteropServices_Marshal_GetLastPInvokeError,
// token 10893,
ves_icall_System_Runtime_InteropServices_Marshal_SetLastPInvokeError,
// token 10894,
ves_icall_System_Runtime_InteropServices_Marshal_StructureToPtr_raw,
// token 10940,
ves_icall_System_Runtime_InteropServices_NativeLibrary_LoadByName_raw,
// token 11022,
ves_icall_System_Runtime_CompilerServices_RuntimeHelpers_InternalGetHashCode_raw,
// token 11025,
ves_icall_System_Runtime_CompilerServices_RuntimeHelpers_GetObjectValue_raw,
// token 11034,
ves_icall_System_Runtime_CompilerServices_RuntimeHelpers_GetUninitializedObjectInternal_raw,
// token 11035,
ves_icall_System_Runtime_CompilerServices_RuntimeHelpers_InitializeArray_raw,
// token 11036,
ves_icall_System_Runtime_CompilerServices_RuntimeHelpers_GetSpanDataFrom_raw,
// token 11037,
ves_icall_System_Runtime_CompilerServices_RuntimeHelpers_RunClassConstructor_raw,
// token 11038,
ves_icall_System_Runtime_CompilerServices_RuntimeHelpers_SufficientExecutionStack,
// token 11039,
ves_icall_System_Runtime_CompilerServices_RuntimeHelpers_InternalBox_raw,
// token 11384,
ves_icall_System_Reflection_Assembly_GetExecutingAssembly_raw,
// token 11385,
ves_icall_System_Reflection_Assembly_GetEntryAssembly_raw,
// token 11389,
ves_icall_System_Reflection_Assembly_InternalLoad_raw,
// token 11390,
ves_icall_System_Reflection_Assembly_InternalGetType_raw,
// token 11422,
ves_icall_System_Reflection_AssemblyName_GetNativeName,
// token 11459,
ves_icall_MonoCustomAttrs_GetCustomAttributesInternal_raw,
// token 11466,
ves_icall_MonoCustomAttrs_GetCustomAttributesDataInternal_raw,
// token 11473,
ves_icall_MonoCustomAttrs_IsDefinedInternal_raw,
// token 11484,
ves_icall_System_Reflection_FieldInfo_internal_from_handle_type_raw,
// token 11487,
ves_icall_System_Reflection_FieldInfo_get_marshal_info_raw,
// token 11512,
ves_icall_System_Reflection_LoaderAllocatorScout_Destroy,
// token 11596,
ves_icall_System_Reflection_RuntimeAssembly_GetManifestResourceNames_raw,
// token 11598,
ves_icall_System_Reflection_RuntimeAssembly_GetExportedTypes_raw,
// token 11610,
ves_icall_System_Reflection_RuntimeAssembly_GetInfo_raw,
// token 11612,
ves_icall_System_Reflection_RuntimeAssembly_GetManifestResourceInfoInternal_raw,
// token 11613,
ves_icall_System_Reflection_RuntimeAssembly_GetManifestResourceInternal_raw,
// token 11614,
ves_icall_System_Reflection_Assembly_GetManifestModuleInternal_raw,
// token 11615,
ves_icall_System_Reflection_RuntimeAssembly_GetModulesInternal_raw,
// token 11622,
ves_icall_System_Reflection_RuntimeCustomAttributeData_ResolveArgumentsInternal_raw,
// token 11637,
ves_icall_RuntimeEventInfo_get_event_info_raw,
// token 11657,
ves_icall_reflection_get_token_raw,
// token 11658,
ves_icall_System_Reflection_EventInfo_internal_from_handle_type_raw,
// token 11666,
ves_icall_RuntimeFieldInfo_ResolveType_raw,
// token 11668,
ves_icall_RuntimeFieldInfo_GetParentType_raw,
// token 11675,
ves_icall_RuntimeFieldInfo_GetFieldOffset_raw,
// token 11676,
ves_icall_RuntimeFieldInfo_GetValueInternal_raw,
// token 11679,
ves_icall_RuntimeFieldInfo_SetValueInternal_raw,
// token 11681,
ves_icall_RuntimeFieldInfo_GetRawConstantValue_raw,
// token 11686,
ves_icall_reflection_get_token_raw,
// token 11692,
ves_icall_get_method_info_raw,
// token 11693,
ves_icall_get_method_attributes,
// token 11700,
ves_icall_System_Reflection_MonoMethodInfo_get_parameter_info_raw,
// token 11702,
ves_icall_System_MonoMethodInfo_get_retval_marshal_raw,
// token 11714,
ves_icall_System_Reflection_RuntimeMethodInfo_GetMethodFromHandleInternalType_native_raw,
// token 11717,
ves_icall_RuntimeMethodInfo_get_name_raw,
// token 11718,
ves_icall_RuntimeMethodInfo_get_base_method_raw,
// token 11719,
ves_icall_reflection_get_token_raw,
// token 11730,
ves_icall_InternalInvoke_raw,
// token 11740,
ves_icall_RuntimeMethodInfo_GetPInvoke_raw,
// token 11746,
ves_icall_RuntimeMethodInfo_MakeGenericMethod_impl_raw,
// token 11747,
ves_icall_RuntimeMethodInfo_GetGenericArguments_raw,
// token 11748,
ves_icall_RuntimeMethodInfo_GetGenericMethodDefinition_raw,
// token 11750,
ves_icall_RuntimeMethodInfo_get_IsGenericMethodDefinition_raw,
// token 11751,
ves_icall_RuntimeMethodInfo_get_IsGenericMethod_raw,
// token 11768,
ves_icall_InvokeClassConstructor_raw,
// token 11770,
ves_icall_InternalInvoke_raw,
// token 11785,
ves_icall_reflection_get_token_raw,
// token 11805,
ves_icall_System_Reflection_RuntimeModule_InternalGetTypes_raw,
// token 11806,
ves_icall_System_Reflection_RuntimeModule_ResolveMethodToken_raw,
// token 11831,
ves_icall_RuntimeParameterInfo_GetTypeModifiers_raw,
// token 11836,
ves_icall_RuntimePropertyInfo_get_property_info_raw,
// token 11866,
ves_icall_reflection_get_token_raw,
// token 11867,
ves_icall_System_Reflection_RuntimePropertyInfo_internal_from_handle_type_raw,
// token 12423,
ves_icall_DynamicMethod_create_dynamic_method_raw,
// token 12511,
ves_icall_AssemblyBuilder_basic_init_raw,
// token 12512,
ves_icall_AssemblyBuilder_UpdateNativeCustomAttributes_raw,
// token 12733,
ves_icall_ModuleBuilder_basic_init_raw,
// token 12734,
ves_icall_ModuleBuilder_set_wrappers_type_raw,
// token 12742,
ves_icall_ModuleBuilder_getUSIndex_raw,
// token 12743,
ves_icall_ModuleBuilder_getToken_raw,
// token 12744,
ves_icall_ModuleBuilder_getMethodToken_raw,
// token 12750,
ves_icall_ModuleBuilder_RegisterToken_raw,
// token 12817,
ves_icall_TypeBuilder_create_runtime_class_raw,
// token 13469,
ves_icall_System_IO_Stream_HasOverriddenBeginEndRead_raw,
// token 13470,
ves_icall_System_IO_Stream_HasOverriddenBeginEndWrite_raw,
// token 14052,
ves_icall_System_Diagnostics_Debugger_IsAttached_internal,
// token 14057,
ves_icall_System_Diagnostics_StackFrame_GetFrameInfo,
// token 14067,
ves_icall_System_Diagnostics_StackTrace_GetTrace,
// token 15040,
ves_icall_Mono_RuntimeClassHandle_GetTypeFromClass,
// token 15061,
ves_icall_Mono_RuntimeGPtrArrayHandle_GPtrArrayFree,
// token 15063,
ves_icall_Mono_SafeStringMarshal_StringToUtf8,
// token 15065,
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
